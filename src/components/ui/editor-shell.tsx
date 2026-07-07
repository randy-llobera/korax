import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

export const EditorWindowDots = () => (
  <div className='flex items-center gap-1.5'>
    <span className='size-3 rounded-full bg-rose-500' />
    <span className='size-3 rounded-full bg-amber-400' />
    <span className='size-3 rounded-full bg-emerald-500' />
  </div>
);

interface EditorCopyButtonProps {
  className?: string;
  copied: boolean;
  disabled: boolean;
  onCopy: () => void;
}

export const EditorCopyButton = ({
  className,
  copied,
  disabled,
  onCopy,
}: EditorCopyButtonProps) => (
  <Button
    type='button'
    variant='ghost'
    size='sm'
    className={cn(
      'h-8 rounded-lg border border-[#4b5563] bg-[#1e1e1e] px-2.5 text-slate-300 hover:bg-[#242424] hover:text-slate-100',
      className,
    )}
    onClick={onCopy}
    disabled={disabled}
    aria-label='Copy editor content'
  >
    {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
    {copied ? 'Copied' : 'Copy'}
  </Button>
);

interface EditorTabButtonProps {
  active: boolean;
  children: ReactNode;
  controls?: string;
  id?: string;
  onClick: () => void;
  rounded?: 'md' | 'full';
}

export const EditorTabButton = ({
  active,
  children,
  controls,
  id,
  onClick,
  rounded = 'full',
}: EditorTabButtonProps) => (
  <button
    id={id}
    type='button'
    role='tab'
    aria-controls={controls}
    aria-selected={active}
    className={cn(
      rounded === 'md' ? 'rounded-md' : 'rounded-full',
      'px-2.5 py-1 text-xs font-medium transition-colors',
      rounded === 'full' && 'px-3 text-[11px] tracking-[0.14em] uppercase',
      active
        ? rounded === 'md'
          ? 'bg-[#303030] text-foreground'
          : 'bg-slate-200 text-slate-950'
        : rounded === 'md'
          ? 'text-muted-foreground'
          : 'text-slate-300 hover:text-white',
    )}
    onClick={onClick}
  >
    {children}
  </button>
);
