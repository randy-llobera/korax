export const getUserInitials = (name?: string | null) => {
  const parts =
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean) ?? [];

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export const getUserAvatarName = ({
  email,
  name,
}: {
  email?: string | null;
  name?: string | null;
}) => {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const fallbackSource = email?.trim();

  if (!fallbackSource) {
    return "User";
  }

  const [localPart] = fallbackSource.split("@");

  return localPart || fallbackSource;
};
