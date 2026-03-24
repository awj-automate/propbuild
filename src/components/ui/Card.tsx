"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({
  children,
  header,
  className = "",
  padding = true,
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E5E7EB] shadow-sm ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-[#E5E7EB]">{header}</div>
      )}
      <div className={padding ? "p-6" : ""}>{children}</div>
    </div>
  );
}
