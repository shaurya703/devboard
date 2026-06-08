import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ label, error, className, id, ...props }, ref) => (
  <div className="space-y-1">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
    )}
    <input
      ref={ref}
      id={id}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500",
        error ? "border-red-400" : "border-slate-300",
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(({ label, error, className, id, ...props }, ref) => (
  <div className="space-y-1">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
    )}
    <textarea
      ref={ref}
      id={id}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500",
        error ? "border-red-400" : "border-slate-300",
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));
Textarea.displayName = "Textarea";
