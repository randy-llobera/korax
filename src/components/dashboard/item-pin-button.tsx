"use client";

import { Pin } from "lucide-react";

import { toggleItemPin } from "@/actions/items";
import type { ItemDrawerDetail } from "@/lib/db/items";

import { ItemOptimisticToggleButton } from "@/components/dashboard/item-optimistic-toggle-button";

interface ItemPinButtonProps {
  className?: string;
  iconClassName?: string;
  itemId: string;
  itemTitle: string;
  isPinned: boolean;
  label?: string;
  onToggled?: (item: ItemDrawerDetail) => void;
  size?: "sm" | "icon-sm";
  stopPropagation?: boolean;
  variant?: "ghost" | "outline";
}

export const ItemPinButton = ({
  className,
  iconClassName,
  itemId,
  itemTitle,
  isPinned,
  label,
  onToggled,
  size = "icon-sm",
  stopPropagation = true,
  variant = "ghost",
}: ItemPinButtonProps) => {
  return (
    <ItemOptimisticToggleButton
      activeClassName="text-primary hover:text-primary"
      activeIconClassName="fill-current text-primary"
      ariaLabel={(active) => (active ? `Unpin ${itemTitle}` : `Pin ${itemTitle}`)}
      variant={variant}
      size={size}
      className={className}
      getActiveValue={(item) => item.isPinned}
      icon={Pin}
      iconClassName={iconClassName}
      initialActive={isPinned}
      itemId={itemId}
      label={label}
      onToggled={onToggled}
      stopPropagation={stopPropagation}
      successMessage={(item) =>
        item.isPinned ? `"${itemTitle}" pinned.` : `"${itemTitle}" unpinned.`
      }
      toggleAction={toggleItemPin}
    />
  );
};
