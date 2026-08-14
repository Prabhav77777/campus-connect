import React from "react";

interface TrustScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TrustScore({ score, size = "md", className = "" }: TrustScoreProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-lg px-3 py-1.5",
  };
  let colorClass = "text-danger bg-danger-light";
  let iconColor = "text-danger";

  if (score >= 5) {
    colorClass = "text-success bg-accent-light";
    iconColor = "text-success";
  } else if (score > 0) {
    colorClass = "text-warning bg-warning-light";
    iconColor = "text-warning";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${sizeClasses[size]} ${colorClass} ${className}`}>
      <svg className={`w-4 h-4 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-1.998A11.954 11.954 0 0110 1.944zM10 14a1 1 0 100-2 1 1 0 000 2zm1-5a1 1 0 00-2 0v3a1 1 0 002 0V9z" clipRule="evenodd" />
      </svg>
      {score}
    </div>
  );
}
