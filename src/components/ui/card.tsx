import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type CardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Card<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...props
}: CardProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={`rounded-lg border border-zinc-200 bg-white p-4 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
