const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const formatDate = (value: string) => DATE_FORMATTER.format(new Date(value));

export const formatUpdatedAt = (value: string) => {
  const now = new Date();
  const currentDate = new Date(value);
  const diffInDays = Math.round(
    (now.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays <= 0) {
    return "Today";
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return DATE_FORMATTER.format(currentDate);
};
