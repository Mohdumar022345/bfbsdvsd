"use client";

import ChatInputBox from "@/components/chat/ChatInputBox";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import ChatDisplay from "@/components/chat/ChatDisplay";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation"; // Import useParams
import { ChatMessage } from "@/types/types";
import axios from "@/lib/axios";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const queryClient = useQueryClient();

  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(conversationId);

  useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  const fetchConversationMessages = async (): Promise<ChatMessage[]> => {
    if (!currentConversationId) {
      return [];
    }

    try {
      const response = await axios.get(
        `/api/conversations/${currentConversationId}/messages`
      );
      return response.data.messages as ChatMessage[];
    } catch (error: any) {
      console.error("Failed to fetch messages:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to fetch messages"
      );
    }
  };

  const { data: messages, isLoading: isFetchingMessages } = useQuery<
    ChatMessage[]
  >({
    queryKey: ["conversationMessages", currentConversationId],
    queryFn: fetchConversationMessages,
    enabled: !!currentConversationId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  return (
    <main className="relative flex items-center h-screen w-full flex-col">
      <Navbar />
      <ChatDisplay
        messages={messages || []}
        isFetchingMessages={isFetchingMessages}
      />
      <ChatInputBox
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
        messages={messages || []}
        queryClient={queryClient}
      />
    </main>
  );
}
