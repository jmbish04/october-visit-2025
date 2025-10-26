import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
};

const baseStyles = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition-all";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-muted-green text-white hover:bg-muted-green/90 focus-visible:ring-2 focus-visible:ring-muted-green/50",
  ghost: "bg-white/60 text-muted-green hover:bg-white",
  outline:
    "border border-muted-green/40 bg-transparent text-muted-green hover:bg-muted-green/10 focus-visible:ring-2 focus-visible:ring-muted-green/30"
};

export function Button({ asChild, variant = "primary", className, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </Comp>
  );
}
