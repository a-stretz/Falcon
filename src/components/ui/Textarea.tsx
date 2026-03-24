import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full rounded-lg bg-zinc-900 border border-zinc-700
            text-zinc-100 placeholder-zinc-500
            px-3 py-2 text-sm leading-relaxed
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            resize-none transition-colors
            ${error ? 'border-red-600' : ''}
            ${className}
          `}
          {...props}
        />
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
