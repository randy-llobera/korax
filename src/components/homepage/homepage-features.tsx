import type { CSSProperties } from "react";
import { Code2, FileText, Folder, Search, Sparkles, Terminal } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Code Snippets",
    description:
      "Save reusable code with syntax highlighting, language detection, and instant copy. Never rewrite the same function twice.",
    accent: "#3b82f6",
    icon: "code",
  },
  {
    title: "AI Prompts",
    description:
      "Store and organize your best prompts for ChatGPT, Claude, and other AI tools. Build a personal prompt library.",
    accent: "#f59e0b",
    icon: "sparkles",
  },
  {
    title: "Instant Search",
    description:
      "Find anything in milliseconds. Search across all your items by content, tags, titles, or type with Cmd+K.",
    accent: "#06b6d4",
    icon: "search",
  },
  {
    title: "Commands",
    description:
      "Keep your most-used terminal commands at your fingertips. No more digging through bash history.",
    accent: "#22c55e",
    icon: "terminal",
  },
  {
    title: "Files & Docs",
    description:
      "Upload and manage files, images, and documents. Keep your project assets organized alongside your code.",
    accent: "#64748b",
    icon: "file",
  },
  {
    title: "Collections",
    description:
      "Group related items into collections. Organize by project, topic, or workflow for quick access.",
    accent: "#6366f1",
    icon: "folder",
  },
] as const;

export function HomepageFeatures() {
  return (
    <section className="bg-[#12121a] py-14 text-center md:py-18 lg:py-30" id="features">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-2 text-3xl leading-tight font-extrabold tracking-normal sm:text-4xl lg:mb-4 lg:text-[2.8rem]">
          Everything You Need,
          <br />
          <span className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
            One Place
          </span>
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-[0.95rem] leading-7 text-muted-foreground md:text-[1.05rem] lg:mb-16">
          Stop context-switching between tools. Korax keeps all your developer resources
          organized and searchable.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border border-border bg-[#12121a] text-left transition hover:-translate-y-1 hover:border-(--feature-accent) hover:ring-(--feature-accent)/30"
              style={{ "--feature-accent": feature.accent } as CSSProperties}
            >
              <CardHeader className="px-5 pt-5 lg:px-6 lg:pt-6">
                <div className="mb-1 flex size-12 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--feature-accent)_15%,transparent)] text-(--feature-accent) [&_svg]:size-6">
                  <FeatureIcon type={feature.icon} />
                </div>
                <CardTitle className="text-[1.15rem] font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 lg:px-6 lg:pb-6">
                <CardDescription className="text-sm leading-6">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ type }: { type: (typeof features)[number]["icon"] }) {
  switch (type) {
    case "code":
      return <Code2 />;
    case "sparkles":
      return <Sparkles />;
    case "search":
      return <Search />;
    case "terminal":
      return <Terminal />;
    case "file":
      return <FileText />;
    case "folder":
      return <Folder />;
  }
}
