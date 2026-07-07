'use client';

import { useEffect, useState, useTransition, type MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { ItemDrawerDetail } from '@/lib/db/items';
import { cn } from '@/lib/utils';

import { useSearch } from '@/components/dashboard/search-provider';
import { Button } from '@/components/ui/button';

interface ToggleActionResult {
  data?: ItemDrawerDetail | null;
  error?: string;
  success: boolean;
}

interface ItemOptimisticToggleButtonProps {
  activeClassName: string;
  activeIconClassName: string;
  ariaLabel: (active: boolean) => string;
  className?: string;
  getActiveValue: (item: ItemDrawerDetail) => boolean;
  icon: LucideIcon;
  iconClassName?: string;
  initialActive: boolean;
  itemId: string;
  label?: string;
  onToggled?: (item: ItemDrawerDetail) => void;
  size?: 'sm' | 'icon-sm';
  stopPropagation?: boolean;
  successMessage: (item: ItemDrawerDetail) => string;
  toggleAction: (itemId: string, active: boolean) => Promise<ToggleActionResult>;
  variant?: 'ghost' | 'outline';
}

export const ItemOptimisticToggleButton = ({
  activeClassName,
  activeIconClassName,
  ariaLabel,
  className,
  getActiveValue,
  icon: Icon,
  iconClassName,
  initialActive,
  itemId,
  label,
  onToggled,
  size = 'icon-sm',
  stopPropagation = true,
  successMessage,
  toggleAction,
  variant = 'ghost',
}: ItemOptimisticToggleButtonProps) => {
  const router = useRouter();
  const { invalidateSearchData } = useSearch();
  const [isPending, startTransition] = useTransition();
  const [optimisticActive, setOptimisticActive] = useState(initialActive);

  useEffect(() => {
    setOptimisticActive(initialActive);
  }, [initialActive]);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }

    const nextActive = !optimisticActive;
    setOptimisticActive(nextActive);

    const result = await toggleAction(itemId, nextActive);

    if (!result.success || !result.data) {
      setOptimisticActive(initialActive);
      toast.error(result.error ?? 'Unable to update item.');
      return;
    }

    setOptimisticActive(getActiveValue(result.data));
    onToggled?.(result.data);
    invalidateSearchData();
    toast.success(successMessage(result.data));
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      type='button'
      variant={variant}
      size={size}
      className={cn(optimisticActive && activeClassName, className)}
      aria-label={ariaLabel(optimisticActive)}
      aria-pressed={optimisticActive}
      disabled={isPending}
      onClick={(event) => {
        void handleClick(event);
      }}
    >
      <Icon
        className={cn(
          'size-4',
          optimisticActive && activeIconClassName,
          iconClassName,
        )}
      />
      {label ? <span>{label}</span> : null}
    </Button>
  );
};
