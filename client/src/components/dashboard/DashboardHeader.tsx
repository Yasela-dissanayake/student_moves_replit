import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  heading: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function DashboardHeader({
  heading,
  description,
  children,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}