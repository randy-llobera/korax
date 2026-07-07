"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { HomepageLogo } from "./homepage-logo";

interface HomepageNavProps {
  isSignedIn: boolean;
}

export function HomepageNav({ isSignedIn }: HomepageNavProps) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const ghostHref = isSignedIn ? "/dashboard" : "/sign-in";
  const ghostLabel = isSignedIn ? "Dashboard" : "Sign In";
  const primaryHref = isSignedIn ? "/dashboard" : "/register";
  const primaryLabel = isSignedIn ? "Open Dashboard" : "Get Started";

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-transparent bg-[#0a0a0f]/60 backdrop-blur-md transition-colors duration-300",
        scrolled && "border-border bg-[#0a0a0f]/90",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <HomepageLogo />
        <div className="hidden gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="outline">
            <Link href={ghostHref}>{ghostLabel}</Link>
          </Button>
          <Button
            asChild
            className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 text-white hover:opacity-90"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="top"
            className="border-border bg-[#0a0a0f]/95 pt-14 backdrop-blur-md md:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <SheetClose asChild>
                <a
                  href="#features"
                  className="py-2 text-sm font-medium text-muted-foreground"
                >
                  Features
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a
                  href="#pricing"
                  className="py-2 text-sm font-medium text-muted-foreground"
                >
                  Pricing
                </a>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild variant="outline">
                  <Link href={ghostHref}>{ghostLabel}</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  asChild
                  className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 text-white"
                >
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
