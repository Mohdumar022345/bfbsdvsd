"use client";

import {
  ArrowRight,
  Atom,
  AudioLines,
  Check,
  Cpu,
  Globe,
  Mic,
  Paperclip,
  Search,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Models } from "@/lib/models";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // Import useRouter
import { ChatMessage } from "@/types/types";

interface ChatInputBoxProps {
  currentConversationId: string | null;
  setCurrentConversationId?: (id: string | null) => void;
  messages: ChatMessage[];
  queryClient: QueryClient;
}

export default function ChatInputBox({
  currentConversationId,
  messages,
  queryClient,
}: ChatInputBoxProps) {
  const [tabValue, setTabValue] = useState("Search");
  const [currentModel, setCurrentModel] = useState("Auto");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
    el.scrollTop = el.scrollHeight;
  }, [prompt]);

  const handleSendMessage = async () => {
    if (prompt.trim() === "") {
      toast.error("Please enter a message.");
      return;
    }

    setIsLoading(true);
    const userMessageContent = prompt.trim();
    setPrompt("");

    let conversationIdToUse = currentConversationId;
    let isNewConversation = false;

    if (!conversationIdToUse) {
      conversationIdToUse = uuidv4();
      isNewConversation = true;
    }

    const newUserMessage: ChatMessage = {
      id: uuidv4(),
      content: userMessageContent,
      sender: "user",
      createdAt: new Date().toISOString(),
      conversationId: conversationIdToUse,
    };

    const newAiMessageId = uuidv4();
    const newAiPlaceholderMessage: ChatMessage = {
      id: newAiMessageId,
      content: "",
      sender: "ai",
      createdAt: new Date().toISOString(),
      conversationId: conversationIdToUse!,
    };

    queryClient.setQueryData<ChatMessage[]>(
      ["conversationMessages", conversationIdToUse],
      (oldMessages) => {
        const updatedMessages = oldMessages ? [...oldMessages] : [];
        updatedMessages.push(newUserMessage);
        updatedMessages.push(newAiPlaceholderMessage);
        return updatedMessages;
      }
    );

    // If it's a new conversation, navigate to the new URL
    if (isNewConversation) {
      router.push(`/c/${conversationIdToUse}`);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessageContent,
          conversationId: conversationIdToUse,
          history: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let receivedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedContent += decoder.decode(value, { stream: true });

          // Update the AI message content in the cache as chunks arrive
          queryClient.setQueryData<ChatMessage[]>(
            ["conversationMessages", conversationIdToUse],
            (oldMessages) => {
              if (!oldMessages) return [];
              return oldMessages.map((msg) =>
                msg.id === newAiMessageId
                  ? { ...msg, content: receivedContent }
                  : msg
              );
            }
          );
        }
      }

      toast.success("Message sent and AI response received!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      // Revert optimistic update or mark as error if needed
      queryClient.setQueryData<ChatMessage[]>(
        ["conversationMessages", conversationIdToUse],
        (oldMessages) => {
          if (!oldMessages) return [];
          return oldMessages.filter(
            (msg) => msg.id !== newUserMessage.id && msg.id !== newAiMessageId
          );
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 w-full">
      <div
        onClick={() => textareaRef.current?.focus()}
        className="p-5 w-full max-w-3xl cursor-text rounded-3xl flex flex-col border-2 gap-5 border-purple-200 bg-purple-100/10"
      >
        <textarea
          rows={1}
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            tabValue === "Search" ? "Ask Anything" : "Research Anything"
          }
          className="w-full p-2 outline-0 leading-tight font-medium text-purple-700 max-h-40 overflow-y-auto resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList
              onClick={(e) => e.stopPropagation()}
              className="bg-purple-100/50 cursor-auto"
            >
              <TabsTrigger
                value="Search"
                className={cn(
                  "text-purple-500 font-semibold",
                  tabValue === "Search" && "outline-2 outline-purple-500"
                )}
              >
                <Search /> Search Only
              </TabsTrigger>
              <TabsTrigger
                value="Research"
                className={cn(
                  "text-purple-500 font-semibold",
                  tabValue === "Research" && "outline-2 outline-purple-500"
                )}
              >
                <Atom /> Reasearch
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-4 cursor-auto"
          >
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Cpu className="text-gray-500 size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="left">
                {Models.map((model) => (
                  <DropdownMenuItem
                    onClick={() => setCurrentModel(model.name)}
                    key={model.name}
                  >
                    <div className="w-5">
                      {model.name === currentModel && (
                        <Check className="text-purple-600 w-5 h-5" />
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-gray-700 font-medium">
                        {model.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {model.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Globe className="text-gray-500 size-5" />
            <Paperclip className="text-gray-500 size-5" />
            <Mic className="text-gray-500 size-5" />
            <Button
              onClick={handleSendMessage}
              disabled={prompt.trim().length === 0 || isLoading}
              className="rounded-lg bg-purple-500 hover:bg-purple-600 transition-all duration-300 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {prompt ? (
                    <ArrowRight className="size-5" />
                  ) : (
                    <AudioLines className="size-5" />
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
