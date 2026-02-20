// Step 4 - Chat API route: the AI agent with tools for adding and retrieving knowledge
import { createResource } from '@/lib/actions/resources';
import { groq } from '@ai-sdk/groq';
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    // Step 4a - Use Gemini via AI studio API key 
    model: groq('moonshotai/kimi-k2-instruct-0905'),
    messages: await convertToModelMessages(messages),
    // Step 4b - Allow up to 5 steps so the model can call tools and then summarize the result
    stopWhen: stepCountIs(5),
    // Step 4c - System prompt: restrict the model to only answer from its knowledge base
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    tools: {
      // Step 4d - Tool to add new information to the knowledge base
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
      // Step 4e - Tool to retrieve relevant information from the knowledge base using semantic search
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
