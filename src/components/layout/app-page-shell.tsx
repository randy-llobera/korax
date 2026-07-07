import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface AppPageShellProps {
  children: ReactNode;
  className?: string;
}

export const AppPageShell = ({ children, className }: AppPageShellProps) => {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 self-center lg:max-w-[80%]',
        className,
      )}
    >
      {children}
    </div>
  );
};
