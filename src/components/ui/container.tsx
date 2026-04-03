import { type HTMLAttributes, forwardRef } from 'react';

const Container = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mx-auto w-full max-w-6xl px-6 ${className}`} {...props}>
        {children}
      </div>
    );
  },
);

Container.displayName = 'Container';

export { Container };
