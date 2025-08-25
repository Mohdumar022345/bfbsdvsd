import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Loader2 } from 'lucide-react';
import { ChatMessage } from '@/types/types';

interface ChatDisplayProps {
  messages: ChatMessage[];
  isFetchingMessages: boolean;
}

const ChatDisplay: React.FC<ChatDisplayProps> = ({ messages, isFetchingMessages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isFetchingMessages]);

 return (
  <div className="flex flex-col h-full overflow-y-auto max-w-3xl w-full">
    {isFetchingMessages ? (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-lg mt-2">Loading conversation...</p>
      </div>
    ) : messages.length === 0 ? (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
        <p className="text-lg">Start a conversation!</p>
        <p className="text-sm">Your messages will appear here.</p>
      </div>
    ) : (
      messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-3 mb-3",
            message.sender === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.sender === "ai" && (
            <Avatar className="size-8">
              <AvatarFallback className="text-lg">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                  AI
                </span>
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              "max-w-[70%] p-3 rounded-lg shadow-md",
              message.sender === "user"
                ? "bg-purple-500 text-white rounded-br-none"
                : "bg-gray-100 text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-200"
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          {message.sender === "user" && (
            <Avatar className="size-8">
              <AvatarImage
                src={user?.avatarUrl || ""}
                alt={user?.name || user?.email}
              />
              <AvatarFallback className="text-lg">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </span>
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))
    )}
    <div ref={messagesEndRef} />
  </div>
);

};

export default ChatDisplay;
