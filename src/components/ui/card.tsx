import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padded = true, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl bg-linen shadow-warm ${padded ? 'p-6' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export { Card, type CardProps };
