"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = getContextPercentage(tokens);

  // Color based on context usage
  const getBarColor = () => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 75) return "bg-yellow-500";
    if (percentage < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    if (percentage < 50) return "text-green-600";
    if (percentage < 75) return "text-yellow-600";
    if (percentage < 90) return "text-orange-600";
    return "text-red-600";
  };

  const getBorderColor = () => {
    if (percentage < 50) return "border-green-200";
    if (percentage < 75) return "border-yellow-200";
    if (percentage < 90) return "border-orange-200";
    return "border-red-200";
  };

  return (
    <div
      className={`w-full bg-muted/30 border rounded-lg transition-all duration-300 ${getBorderColor()}`}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getBarColor()}`} />
            <span className={`text-sm font-medium ${getTextColor()}`}>
              {percentage.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTokens(tokens)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {formatCost(cost)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50">
          {/* Progress Bar */}
          <div className="space-y-2 pt-3">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens Used:</span>
                <span className="font-medium">{formatTokens(tokens)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Limit:</span>
                <span className="font-medium">
                  {formatTokens(CONTEXT_LIMIT)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usage:</span>
                <span className={`font-medium ${getTextColor()}`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium">{formatCost(cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">Claude 3.5 Sonnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <div className="flex items-center gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${getBarColor()}`}
                  />
                  <span className="font-medium text-foreground">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
