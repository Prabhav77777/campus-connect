import React from "react";

export type MatchStatus = "PENDING" | "CONFIRMED" | "PURCHASED" | "DELIVERED_SETTLED";

const steps = [
  { id: "PENDING", label: "Pending Match" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PURCHASED", label: "Item Purchased" },
  { id: "DELIVERED_SETTLED", label: "Delivered & Settled" },
];

export function StatusTimeline({ currentStatus }: { currentStatus: MatchStatus }) {
  const currentIndex = steps.findIndex((s) => s.id === currentStatus);

  return (
    <div className="relative flex flex-col space-y-6">
      {/* Connecting line */}
      <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-secondary -z-10" />
      
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        
        let colorClasses = "bg-secondary border-secondary text-text-muted";
        if (isCompleted) {
          colorClasses = "bg-success border-success text-white";
        } else if (isActive) {
          colorClasses = "bg-surface-raised border-primary border-2 text-primary shadow-sm";
        }

        return (
          <div key={step.id} className="flex items-center gap-4">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${colorClasses}`}>
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : isActive ? (
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              ) : null}
            </div>
            <span className={`text-sm font-medium ${isActive || isCompleted ? "text-text" : "text-text-muted"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
