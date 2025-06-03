"use client";

import OracleAvatar from "@/components/oracle-avatar";

export default function TypingIndicator() {
  return (
    <div className="w-full">
      <div className="flex gap-3 mb-2">
        <div className="flex-shrink-0">
          <OracleAvatar />
        </div>
        <div className="font-semibold text-gray-800">The Oracle</div>
      </div>
      <div className="ml-11 text-gray-900">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600 mr-2">
            The Oracle is thinking
          </span>
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
