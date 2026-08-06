import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
}

const variants = {
  default:
    "bg-[var(--portal-primary)] text-white hover:bg-[var(--portal-primary-hover)]",
  outline:
    "border border-[var(--portal-sidebar-border)] bg-white text-[var(--portal-ink)] hover:bg-[#f4f5f7]",
  ghost: "text-[var(--portal-ink)] hover:bg-[#f4f5f7]",
  secondary:
    "bg-[#f4f5f7] text-[var(--portal-ink)] hover:bg-[var(--portal-sidebar-border)]",
};

const sizes = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
