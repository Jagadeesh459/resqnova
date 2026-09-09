"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type NeonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-base",
};

const variantClasses = {
  primary:
    "bg-primary text-background shadow-neon hover:bg-primary/90 hover:shadow-glow",
  secondary:
    "border border-primary/35 bg-white/5 text-text hover:border-primary/60 hover:bg-primary/10",
};

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-0 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

NeonButton.displayName = "NeonButton";
