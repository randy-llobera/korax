"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/users/avatar";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  fallbackLabel?: string;
  size?: "default" | "sm" | "lg";
}

export const UserAvatar = ({
  name,
  image,
  fallbackLabel = "User",
  size = "default",
}: UserAvatarProps) => {
  const label = name?.trim() || fallbackLabel;

  return (
    <Avatar size={size}>
      {image ? <AvatarImage src={image} alt={`${label} avatar`} /> : null}
      <AvatarFallback>{getUserInitials(name || fallbackLabel)}</AvatarFallback>
    </Avatar>
  );
};
