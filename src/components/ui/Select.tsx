import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-zinc-300">{label}</label>
        )}
        <select
          ref={ref}
          className={`
            w-full rounded-lg bg-zinc-900 border border-zinc-700
            text-zinc-100
            px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-colors cursor-pointer
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
