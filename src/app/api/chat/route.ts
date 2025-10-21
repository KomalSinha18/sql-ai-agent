import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const SYSTEM_PROMPT = `You are an expert SQL assistant that helps users to query their database using natural language.
    You have access to following tools:
    1. db tool - call this tool to query the database.
   

Rules:
- Generate ONLY SELECT queries (no INSERT, UPDATE, DELETE, DROP)
- Pass in valid SQL syntax in db tool.
- IMPORTANT: To query database call db tool, Don't return just SQL query.

Always respond in a helpful, conversational tone while being technically accurate.`;

  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    tools: {
      db: tool({
        description: "Call this tool to query the database.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("The SQL query to execute on the database."),
        }),
        execute: async ({ query }) => {
          console.log("Executing DB query:", query);
          return query
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
