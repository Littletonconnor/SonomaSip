import { type HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'wine' | 'gold' | 'sage' | 'stone';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  wine: 'bg-wine/10 text-wine',
  gold: 'bg-gold/15 text-oak',
  sage: 'bg-sage/15 text-sage',
  stone: 'bg-fog text-stone',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'wine', className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge, type BadgeProps };
