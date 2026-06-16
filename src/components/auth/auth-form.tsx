"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
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
  defaultValue,
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
  name,
  ref,
  layout = "stacked",
}: FieldProps) {
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  const isHorizontal = layout === "horizontal";

  const inputBox = (
    <div
      className={cn(
        "group/field relative flex items-center rounded-2xl border border-border/70 bg-background/50 transition-all duration-200",
        "focus-within:border-[var(--coral)] focus-within:ring-4 focus-within:ring-[var(--coral)]/10 focus-within:bg-background/90",
        error
          ? "border-destructive/60 ring-4 ring-destructive/10 bg-destructive/5"
          : "",
        disabled && "opacity-60 cursor-not-allowed",
        isHorizontal ? "flex-1" : "w-full",
      )}
    >
      {leftSlot && <div className="pl-3.5">{leftSlot}</div>}
      <input
        id={id}
        name={name ?? id}
        type={inputType}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        inputMode={inputMode}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        className="h-11 w-full min-w-0 rounded-2xl bg-transparent px-4 text-[13.5px] font-medium outline-none text-foreground placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
      />
      {(isPassword || rightSlot) && (
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {rightSlot}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={show}
              className="grid size-8 place-items-center rounded-xl text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground active:scale-95"
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
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          htmlFor={id}
          className="text-[12.5px] font-bold tracking-tight text-foreground/80"
        >
          {label}
        </label>
        <div>
          {inputBox}
          {error ? (
            <p
              id={`${id}-error`}
              className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-destructive animate-fade-in"
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
        className="text-[12.5px] font-bold tracking-tight text-foreground/80"
      >
        {label}
      </label>
      {inputBox}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-[11.5px] font-semibold text-destructive animate-fade-in"
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
      className="flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[12.5px] font-semibold text-destructive animate-fade-in"
    >
      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive" />
      <span className="leading-normal">{message}</span>
    </div>
  );
}

export function AuthDivider({ label = "atau" }: { label?: string }) {
  return (
    <div className="relative my-2 flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0", className)}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
