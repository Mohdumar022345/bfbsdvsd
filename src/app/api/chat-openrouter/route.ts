import { OpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: openrouter.chat('mistralai/mistral-7b-instruct'), // You can choose other models from OpenRouter
      messages,
      // Optional: Add system prompt or other parameters as needed
    });

    return result.toResponse();
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get AI response from OpenRouter' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
