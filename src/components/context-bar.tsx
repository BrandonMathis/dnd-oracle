"use client";

import {
  formatTokens,
  formatCost,
  getContextPercentage,
  CONTEXT_LIMIT,
} from "@/lib/token-utils";

interface ContextBarProps {
  tokens: number;
  cost: number;
}

export default function ContextBar({ tokens, cost }: ContextBarProps) {
  const percentage = getContextPercentage(tokens);

  // Color based on context usage
  const getBarColor = () => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 75) return "bg-yellow-500";
    if (percentage < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    if (percentage < 50) return "text-green-700";
    if (percentage < 75) return "text-yellow-700";
    if (percentage < 90) return "text-orange-700";
    return "text-red-700";
  };

  return (
    <div className="w-full bg-gray-100 border-b border-gray-200 p-3">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className={`font-medium ${getTextColor()}`}>
          {formatTokens(tokens)} / {formatTokens(CONTEXT_LIMIT)} tokens
        </span>
        <span className="font-medium text-gray-700">{formatCost(cost)}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
        <span>{percentage.toFixed(1)}% context used</span>
        <span>Claude 3.5 Sonnet</span>
      </div>
    </div>
  );
}
