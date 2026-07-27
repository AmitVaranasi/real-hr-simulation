import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
}

const variants = {
  default: "bg-[#e67e22] text-white hover:bg-[#d35400]",
  outline:
    "border border-[#dde1e6] bg-white text-[#1f2937] hover:bg-[#f4f5f7]",
  ghost: "text-[#1f2937] hover:bg-[#f4f5f7]",
  secondary: "bg-[#f4f5f7] text-[#1f2937] hover:bg-[#dde1e6]",
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
