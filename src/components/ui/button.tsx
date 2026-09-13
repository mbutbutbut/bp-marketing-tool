import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary";

export function buttonClasses(variant: ButtonVariant = "primary") {
  return variant === "primary"
    ? "rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    : "rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50";
}

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`${buttonClasses(variant)} ${className}`} {...props} />;
}
