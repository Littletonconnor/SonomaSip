'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  sections: { label: string; href: string }[];
}

export function SidebarNav({ sections }: SidebarNavProps) {
  const [activeId, setActiveId] = useState('');

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (!el) return;

    setActiveId(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="max-md:hidden">
      <ul role="list" className="sticky top-20 space-y-2">
        {sections.map((item) => {
          const id = item.href.replace('#', '');
          const isActive = activeId === id;

          return (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={cn(
                  'text-sm transition-colors duration-200',
                  isActive ? 'text-wine font-medium' : 'text-stone hover:text-wine',
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
