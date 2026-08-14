import React, { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && <label className="text-sm font-medium text-text">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={`
              appearance-none w-full px-3 py-2 bg-surface-raised border rounded-md shadow-sm outline-none 
              transition-all duration-200 text-text
              focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:bg-surface
              ${error ? "border-danger focus:ring-danger" : "border-border hover:border-border-light"}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
