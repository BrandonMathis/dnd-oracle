"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Copy, CopyIcon } from "lucide-react";
import OracleAvatar from "@/components/oracle-avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ContextBar from "@/components/context-bar";
import TypingIndicator from "@/components/typing-indicator";
import { estimateTokens, estimateCost } from "@/lib/token-utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isCopyAnimating, setIsCopyAnimating] = useState(false);
  const [showContextBar, setShowContextBar] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleOracleHeadingClick = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;

    if (timeDiff <= 1000) {
      // Within 1 second of last click
      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);

      if (newClickCount >= 3) {
        // Triple click achieved - toggle ContextBar visibility
        setShowContextBar(!showContextBar);
        // Reset click count
        setClickCount(0);
        setLastClickTime(0);
      } else {
        setLastClickTime(currentTime);
      }
    } else {
      // More than 1 second since last click - reset
      setClickCount(1);
      setLastClickTime(currentTime);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    // Update token count and cost immediately when user sends message
    const userConversationText = newMessages
      .map((msg) => msg.content)
      .join(" ");
    const userTokens = estimateTokens(userConversationText);
    const userCost = estimateCost(userTokens);
    setTotalTokens(userTokens);
    setTotalCost(userCost);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              const finalMessages = [
                ...newMessages,
                { role: "assistant" as const, content: assistantContent },
              ];
              setMessages(finalMessages);
              setStreamingContent("");
              setIsLoading(false);

              // Update token count and cost
              const conversationText = finalMessages
                .map((msg) => msg.content)
                .join(" ");
              const tokens = estimateTokens(conversationText);
              const cost = estimateCost(tokens);
              setTotalTokens(tokens);
              setTotalCost(cost);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setStreamingContent(assistantContent);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              console.error("Parse error:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant" as const,
        content: `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      setIsLoading(false);
      setStreamingContent("");

      // Update token count and cost even for errors
      const conversationText = finalMessages
        .map((msg) => msg.content)
        .join(" ");
      const tokens = estimateTokens(conversationText);
      const cost = estimateCost(tokens);
      setTotalTokens(tokens);
      setTotalCost(cost);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const copyResponse = (content: string) => {
    copyToClipboard(content);
  };

  const copyEntireConversation = () => {
    const conversationMarkdown = messages
      .map((message) => {
        const role = message.role === "user" ? "You" : "The Oracle";
        return `**${role}:**\n${message.content}\n`;
      })
      .join("\n---\n\n");

    copyToClipboard(conversationMarkdown);

    // Trigger animation
    setIsCopyAnimating(true);
    setTimeout(() => setIsCopyAnimating(false), 600);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-2 sm:p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <OracleAvatar className="w-6 h-6 sm:w-8 sm:h-8" />
              <span
                className="text-lg sm:text-xl cursor-pointer select-none hover:text-blue-600 transition-colors"
                onClick={handleOracleHeadingClick}
                title="Click 3 times quickly to toggle context bar"
              >
                The Oracle
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyEntireConversation}
              disabled={messages.length === 0}
              className={`flex items-center justify-center w-12 h-10 sm:w-10 sm:h-8 p-0 transition-all duration-300 cursor-pointer touch-manipulation ${
                isCopyAnimating
                  ? "bg-green-100 border-green-300 scale-110"
                  : "hover:bg-gray-50"
              }`}
              title="Copy conversation"
            >
              <CopyIcon
                className={`w-5 h-5 sm:w-4 sm:h-4 transition-all duration-300 ${
                  isCopyAnimating ? "text-green-600 scale-125" : "text-gray-600"
                }`}
              />
            </Button>
          </CardTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connected to Google Doc</span>
            </div>
            <a
              href="https://docs.google.com/document/d/1zKVB97yASZQTTfjfsqL-NFZyVSIYAVyttKyqRVNvINg/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline touch-manipulation py-1"
            >
              View Document
            </a>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col px-3 sm:px-6">
          {showContextBar && (
            <div className="mb-3 sm:mb-4">
              <ContextBar tokens={totalTokens} cost={totalCost} />
            </div>
          )}
          <ScrollArea className="flex-1 pr-2 sm:pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 sm:space-y-6">
              {messages.map((message, index) => (
                <div key={index}>
                  {message.role === "user" ? (
                    // User message - optimized for mobile
                    <div className="flex justify-end">
                      <div className="flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] flex-row-reverse">
                        <div className="flex-shrink-0">
                          <User className="w-7 h-7 sm:w-8 sm:h-8 p-1.5 sm:p-2 bg-blue-500 text-white rounded-full" />
                        </div>
                        <div className="p-3 sm:p-4 rounded-lg bg-blue-500 text-white text-sm sm:text-base leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Assistant message - optimized for mobile
                    <div className="w-full">
                      <div className="flex gap-2 sm:gap-3 mb-2">
                        <div className="flex-shrink-0">
                          <OracleAvatar className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div className="font-semibold text-gray-800 text-sm sm:text-base">
                          The Oracle
                        </div>
                        <div className="flex-1"></div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyResponse(message.content)}
                          className="h-8 w-8 sm:h-6 sm:w-auto sm:px-2 p-0 sm:p-1 text-gray-500 hover:text-gray-700 cursor-pointer touch-manipulation"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="ml-2 sm:ml-11 text-gray-900">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-3 last:mb-0 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-800">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-gray-800">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-base font-medium mb-2 mt-3 first:mt-0 text-gray-700">
                                  {children}
                                </h3>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => (
                                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto mb-3 border">
                                  {children}
                                </pre>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside mb-3 space-y-1 ml-2">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-3 space-y-1 ml-2">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="leading-relaxed">{children}</li>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
                                  {children}
                                </blockquote>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-gray-800">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-gray-700">
                                  {children}
                                </em>
                              ),
                              a: ({ children, href }) => (
                                <a
                                  href={href}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto mb-3">
                                  <table className="min-w-full border border-gray-300 rounded-lg">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold text-left">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-gray-300 px-3 py-2">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {streamingContent && (
                <div className="w-full">
                  <div className="flex gap-2 sm:gap-3 mb-2">
                    <div className="flex-shrink-0">
                      <OracleAvatar className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">
                      The Oracle
                    </div>
                  </div>
                  <div className="ml-9 sm:ml-11 text-gray-900">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="mb-3 last:mb-0 leading-relaxed">
                              {children}
                            </p>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-800">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-gray-800">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-medium mb-2 mt-3 first:mt-0 text-gray-700">
                              {children}
                            </h3>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto mb-3 border">
                              {children}
                            </pre>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-3 space-y-1 ml-2">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-3 space-y-1 ml-2">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
                              {children}
                            </blockquote>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-800">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-gray-700">{children}</em>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              className="text-blue-600 hover:text-blue-800 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto mb-3">
                              <table className="min-w-full border border-gray-300 rounded-lg">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold text-left">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-gray-300 px-3 py-2">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                  </div>
                </div>
              )}

              {isLoading && !streamingContent && <TypingIndicator />}
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 px-1"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 h-12 sm:h-10 text-base sm:text-sm px-4 sm:px-3 rounded-lg"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 sm:h-10 sm:w-10 rounded-lg touch-manipulation"
            >
              <Send className="w-5 h-5 sm:w-4 sm:h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
