import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  textarea?: boolean;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, textarea = false, className = "", ...props }, ref) => {
    const Component = textarea ? "textarea" : "input";
    
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className="text-sm font-medium text-text">{label}</label>}
        <Component
          ref={ref as any}
          className={`
            px-3 py-2 bg-surface-raised border rounded-md shadow-sm outline-none 
            transition-all duration-200 text-text placeholder-text-light
            focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:bg-surface
            ${error ? "border-danger focus:ring-danger" : "border-border hover:border-border-light"}
          `}
          {...(props as any)}
        />
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
