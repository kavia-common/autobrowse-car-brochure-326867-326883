"use client";

import React from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
export function Button({
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  /** Consistent button styling across the app. */
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary:
      "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm",
    ghost: "bg-transparent text-slate-800 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  };

  return (
    <button
      {...props}
      className={cn(base, sizes, variants[variant], props.className)}
    />
  );
}

// PUBLIC_INTERFACE
export function Input({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
}) {
  /** Labeled input with hint/error slot. */
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      ) : null}
      <input
        {...props}
        className={cn(
          "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400",
          props.className
        )}
      />
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </label>
  );
}

// PUBLIC_INTERFACE
export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: React.ReactNode;
}) {
  /** Labeled select control. */
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      ) : null}
      <select
        {...props}
        className={cn(
          "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400",
          props.className
        )}
      >
        {children}
      </select>
    </label>
  );
}

// PUBLIC_INTERFACE
export function Textarea({
  label,
  hint,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
}) {
  /** Labeled textarea. */
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      ) : null}
      <textarea
        {...props}
        className={cn(
          "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400",
          props.className
        )}
      />
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </label>
  );
}

// PUBLIC_INTERFACE
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  /** White surface card with subtle border/shadow. */
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

// PUBLIC_INTERFACE
export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "cyan" | "red" | "green";
}) {
  /** Small badge for categories/status. */
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    cyan: "bg-cyan-50 text-cyan-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[tone])}>
      {children}
    </span>
  );
}

// PUBLIC_INTERFACE
export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  /** Empty state block with optional actions. */
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto max-w-md">
        <div className="text-base font-semibold">{title}</div>
        {description ? (
          <div className="mt-1 text-sm text-slate-600">{description}</div>
        ) : null}
        {actions ? <div className="mt-4 flex justify-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
