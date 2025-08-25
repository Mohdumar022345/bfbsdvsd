export type UserData = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  content: string;
  sender: "user" | "ai";
  createdAt: string;
  conversationId: string;
};