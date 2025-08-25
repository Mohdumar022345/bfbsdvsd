// src/app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { prompt, conversationId, history } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return new Response(JSON.stringify({ error: "Prompt is required and must be a non-empty string" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!conversationId || typeof conversationId !== 'string') {
      return new Response(JSON.stringify({ error: "Conversation ID is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let conversation;
    conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId: user.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: conversationId,
          userId: user.id,
        },
      });
    }

    // Save the user's message to the database
    await prisma.message.create({
      data: {
        content: prompt,
        sender: "user",
        userId: user.id,
        conversationId: conversation.id,
      },
    });

    // Prepare messages for the AI model, including history
    // The 'ai' SDK expects messages in a specific format: { role: 'user' | 'assistant', content: string }
    const messagesForAI = history.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
    // Add the current user prompt
    messagesForAI.push({ role: 'user', content: prompt });

    // Call the OpenRouter AI API route
    const aiResponse = await fetch(`${request.nextUrl.origin}/api/chat-openrouter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: messagesForAI }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      console.error('Error from OpenRouter API route:', errorData);
      return new Response(JSON.stringify({ error: errorData.error || 'Failed to get AI response' }), {
        status: aiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream the AI response back to the frontend
    const reader = aiResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullAiResponseContent = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullAiResponseContent += chunk; // Accumulate full response
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();

        // After streaming is complete, save the full AI response to the database
        await prisma.message.create({
          data: {
            content: fullAiResponseContent,
            sender: "ai",
            userId: user.id,
            conversationId: conversation.id,
          },
        });
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Or 'text/event-stream' for SSE
        'X-Conversation-Id': conversation.id,
      },
      status: 200,
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
