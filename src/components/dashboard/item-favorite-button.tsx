"use client";

import { Star } from "lucide-react";

import { toggleItemFavorite } from "@/actions/items";
import type { ItemDrawerDetail } from "@/lib/db/items";

import { ItemOptimisticToggleButton } from "@/components/dashboard/item-optimistic-toggle-button";

interface ItemFavoriteButtonProps {
  className?: string;
  iconClassName?: string;
  itemId: string;
  itemTitle: string;
  isFavorite: boolean;
  label?: string;
  onToggled?: (item: ItemDrawerDetail) => void;
  size?: "sm" | "icon-sm";
  stopPropagation?: boolean;
  variant?: "ghost" | "outline";
}

export const ItemFavoriteButton = ({
  className,
  iconClassName,
  itemId,
  itemTitle,
  isFavorite,
  label,
  onToggled,
  size = "icon-sm",
  stopPropagation = true,
  variant = "ghost",
}: ItemFavoriteButtonProps) => {
  return (
    <ItemOptimisticToggleButton
      activeClassName="text-yellow-400 hover:text-yellow-400"
      activeIconClassName="fill-current text-yellow-400"
      ariaLabel={(active) =>
        active ? `Remove ${itemTitle} from favorites` : `Add ${itemTitle} to favorites`
      }
      variant={variant}
      size={size}
      className={className}
      getActiveValue={(item) => item.isFavorite}
      icon={Star}
      iconClassName={iconClassName}
      initialActive={isFavorite}
      itemId={itemId}
      label={label}
      onToggled={onToggled}
      stopPropagation={stopPropagation}
      successMessage={(item) =>
        item.isFavorite
          ? `"${itemTitle}" added to favorites.`
          : `"${itemTitle}" removed from favorites.`
      }
      toggleAction={toggleItemFavorite}
    />
  );
};
