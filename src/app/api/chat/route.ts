import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  fetchGoogleDocContent,
  extractDocIdFromUrl,
} from "@/lib/google-doc-fetcher";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Fetch Google Doc content using MCP integration
          const googleDocUrl =
            "https://docs.google.com/document/d/1zKVB97yASZQTTfjfsqL-NFZyVSIYAVyttKyqRVNvINg/edit?usp=sharing";
          const docId = extractDocIdFromUrl(googleDocUrl);
          const docContent = docId ? await fetchGoogleDocContent(docId) : null;

          // Add system prompt with Google Doc context
          const systemPrompt = `You are "The Oracle", a specialized D&D assistant with access to a specific Google Document containing custom lore and world-building information.

IMPORTANT RESTRICTIONS:
- Your name is "The Oracle"
- For ANY D&D lore, world-building, or setting-related questions, you must ONLY reference the content from this Google Document
- Do NOT reference any other D&D source material (Player's Handbook, Monster Manual, official campaigns, etc.) for lore-related content
- If asked about D&D lore not covered in the Google Document, clearly state that you only have access to the custom lore in the connected document
- You can still help with general D&D rules, mechanics, and gameplay advice, but all lore must come from the Google Document

GOOGLE DOCUMENT CONTENT (LIVE FETCHED):
${
  docContent ||
  "Unable to fetch document content at this time. Please ensure the document is publicly accessible."
}

${
  docContent
    ? "The above content is the complete, up-to-date lore and world-building information for this specific D&D campaign/setting. Always prioritize and reference this document when discussing any story, character, location, or world-building elements."
    : ""
}`;

          const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            system: systemPrompt,
            messages: messages,
            stream: true,
          });

          for await (const chunk of response) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ content: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Anthropic API error:", error);
          const errorData = JSON.stringify({
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
