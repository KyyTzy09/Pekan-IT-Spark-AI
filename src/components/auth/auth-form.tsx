"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  rightSlot?: React.ReactNode;
  leftSlot?: React.ReactNode;
  className?: string;
  name?: string;
  ref?: React.Ref<HTMLInputElement>;
  layout?: "stacked" | "horizontal";
};

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  required,
  disabled,
  error,
  hint,
  inputMode,
  rightSlot,
  leftSlot,
  className,
  layout = "stacked",
}: FieldProps) {
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  const isHorizontal = layout === "horizontal";

  const inputBox = (
    <div
      className={cn(
        "group/field relative flex items-center rounded-2xl border bg-input/40 transition-[color,box-shadow] duration-200",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25",
        error
          ? "border-destructive/60 ring-3 ring-destructive/15"
          : "border-transparent",
        disabled && "opacity-60",
        isHorizontal ? "flex-1" : "w-full",
      )}
    >
      {leftSlot && <div className="pl-3">{leftSlot}</div>}
      <input
        id={id}
        name={id}
        type={inputType}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        className="h-11 w-full min-w-0 rounded-2xl bg-transparent px-3.5 text-[14px] outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"
      />
      {(isPassword || rightSlot) && (
        <div className="absolute right-1.5 flex items-center">
          {rightSlot}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={show}
              className="grid size-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isHorizontal) {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4",
          className,
        )}
      >
        <label
          htmlFor={id}
          className="shrink-0 pt-2.5 text-right text-[12.5px] font-semibold text-foreground/80 sm:w-24"
        >
          {label}
        </label>
        <div className="flex-1">
          {inputBox}
          {error ? (
            <p
              id={`${id}-error`}
              className="mt-1 flex items-center gap-1 text-[11.5px] font-medium text-destructive"
            >
              <span className="size-1 rounded-full bg-destructive" />
              {error}
            </p>
          ) : hint ? (
            <p
              id={`${id}-hint`}
              className="mt-1 text-[11.5px] font-medium text-muted-foreground/80"
            >
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[12.5px] font-semibold text-foreground/80"
      >
        {label}
      </label>
      {inputBox}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-[11.5px] font-medium text-destructive"
        >
          <span className="size-1 rounded-full bg-destructive" />
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className="text-[11.5px] font-medium text-muted-foreground/80"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive"
    >
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
      {message}
    </div>
  );
}

export function AuthDivider({ label = "atau" }: { label?: string }) {
  return (
    <div className="relative my-1 flex items-center gap-3">
      <div className="h-px flex-1 bg-border/60" />
      <span className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}
