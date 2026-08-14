import React from "react";

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  className?: string;
}

export function Card({ children, header, padding = "md", hoverable = false, className = "" }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        bg-surface-raised border border-border rounded-lg shadow-sm 
        transition-shadow duration-200
        ${hoverable ? "hover:shadow-md" : ""}
        ${className}
      `}
    >
      {header && (
        <div className="px-6 py-4 border-b border-border">
          {header}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
    </div>
  );
}
