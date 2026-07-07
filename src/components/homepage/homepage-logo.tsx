import Link from "next/link";
import { Folder } from "lucide-react";

export function HomepageLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-lg font-bold text-foreground"
    >
      <Folder className="size-7 shrink-0" />
      Korax
    </Link>
  );
}
