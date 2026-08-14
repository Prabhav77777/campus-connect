"use client";

import React from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex space-x-1 border-b border-border ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 
              ${isActive 
                ? "border-primary text-primary" 
                : "border-transparent text-text-muted hover:text-text hover:border-border-light"}
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
