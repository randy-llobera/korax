import {
  Code,
  File,
  ImageIcon,
  LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

const ITEM_TYPE_ICON_MAP = {
  Code,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
} as const;

export const getItemTypeIcon = (icon: string): LucideIcon => {
  return ITEM_TYPE_ICON_MAP[icon as keyof typeof ITEM_TYPE_ICON_MAP] ?? File;
};
