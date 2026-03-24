type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  success: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  warning: 'bg-amber-900/40 text-amber-300 border-amber-800',
  danger: 'bg-red-900/40 text-red-300 border-red-800',
  info: 'bg-blue-900/40 text-blue-300 border-blue-800',
  purple: 'bg-purple-900/40 text-purple-300 border-purple-800',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border
        ${variantStyles[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
}
