// Token counting and cost estimation utilities

// Rough token estimation (Claude uses ~4 characters per token on average)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Claude 3.5 Sonnet pricing (as of 2024)
const CLAUDE_PRICING = {
  input: 0.003, // $0.003 per 1K input tokens
  output: 0.015, // $0.015 per 1K output tokens
};

export function estimateCost(
  inputTokens: number,
  outputTokens: number = 0
): number {
  const inputCost = (inputTokens / 1000) * CLAUDE_PRICING.input;
  const outputCost = (outputTokens / 1000) * CLAUDE_PRICING.output;
  return inputCost + outputCost;
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

// Claude 3.5 Sonnet context window limit
export const CONTEXT_LIMIT = 200000; // 200K tokens

export function getContextPercentage(tokens: number): number {
  return Math.min((tokens / CONTEXT_LIMIT) * 100, 100);
}
