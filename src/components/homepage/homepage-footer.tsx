import Link from "next/link";

import { HomepageLogo } from "./homepage-logo";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Collections", href: "/collections" },
      { label: "Favorites", href: "/favorites" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "Register", href: "/register" },
      { label: "Profile", href: "/profile" },
    ],
  },
] as const;

export function HomepageFooter() {
  return (
    <footer className="border-t border-border py-10 pb-6 md:py-12 md:pb-6 lg:pt-16 lg:pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 grid grid-cols-3 gap-x-3 gap-y-5 md:gap-x-4 lg:mb-12 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          <div className="col-span-full lg:col-span-1">
            <HomepageLogo />
            <p className="mt-3 max-w-none text-sm leading-6 text-muted-foreground lg:max-w-72">
              Your developer knowledge hub. One place for snippets, prompts, commands, and more.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-2 lg:gap-2.5">
              <h4 className="mb-1 text-[0.72rem] font-bold tracking-[0.06em] text-foreground uppercase lg:text-[0.85rem] lg:tracking-[0.08em]">
                {column.title}
              </h4>
              {column.links.map((link) =>
                link.href.startsWith("#") ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground lg:text-sm"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground lg:text-sm"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 text-center">
          <p className="text-[0.85rem] text-muted-foreground/70">
            © {new Date().getFullYear()} Korax. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
