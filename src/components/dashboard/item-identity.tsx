import { createElement } from 'react';

import { cn } from '@/lib/utils';

import { getItemTypeIcon } from '@/components/utils/item-type';

interface ItemTypeIconBadgeProps {
  borderColor?: string | null;
  className?: string;
  color?: string | null;
  icon: string;
  iconClassName?: string;
}

export const ItemTypeIconBadge = ({
  borderColor,
  className,
  color,
  icon,
  iconClassName = 'size-4',
}: ItemTypeIconBadgeProps) => (
  <div
    className={cn(
      'rounded-xl border border-border/60 bg-muted/50 p-2 text-muted-foreground',
      className,
    )}
    style={borderColor ? { borderColor } : undefined}
  >
    {createElement(getItemTypeIcon(icon), {
      className: iconClassName,
      style: color ? { color } : undefined,
    })}
  </div>
);
