"use client";

import ChatInputBox from "@/components/chat/ChatInputBox";
import { ChatMessage } from "@/types/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages] = useState<ChatMessage[]>([]);
  const queryClient = useQueryClient();

  return (
    <main className="flex flex-col h-full items-center justify-center p-3 w-full space-y-10">
      <span className="select-none text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
        Reseach-o-Bot
      </span>
      <ChatInputBox
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
        messages={messages || []}
        queryClient={queryClient}
      />
    </main>
  );
}
