"use client";

import * as React from "react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

const chaosIcons = [
  "notion",
  "github",
  "slack",
  "vscode",
  "browser",
  "terminal",
  "textfile",
  "bookmark",
] as const;

const initialIconRatios = [
  { x: 0.12, y: 0.16 },
  { x: 0.64, y: 0.08 },
  { x: 0.44, y: 0.34 },
  { x: 0.08, y: 0.58 },
  { x: 0.7, y: 0.48 },
  { x: 0.28, y: 0.74 },
  { x: 0.8, y: 0.72 },
  { x: 0.84, y: 0.2 },
] as const;

const sidebarItems = [
  { label: "Snippets", color: "#3b82f6" },
  { label: "Prompts", color: "#8b5cf6" },
  { label: "Commands", color: "#f97316" },
  { label: "Notes", color: "#fde047" },
  { label: "Files", color: "#6b7280" },
  { label: "Images", color: "#ec4899" },
  { label: "Links", color: "#10b981" },
] as const;

const dashboardCards = [
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#3b82f6",
  "#fde047",
  "#6b7280",
];

export function HomepageChaosAnimation() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const icons = Array.from(
      container.querySelectorAll<HTMLElement>("[data-chaos-icon='true']"),
    );

    const SPEED = 0.6;
    const REPEL_RADIUS = 80;
    const REPEL_FORCE = 0.5;

    let mouse = { x: -9999, y: -9999 };
    let containerRect = container.getBoundingClientRect();

    const handleMouseMove = (event: MouseEvent) => {
      containerRect = container.getBoundingClientRect();
      mouse = {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      };
    };

    const handleMouseLeave = () => {
      mouse = { x: -9999, y: -9999 };
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    const state = icons.map((icon, index) => {
      const width = containerRect.width || 400;
      const height = containerRect.height || 280;
      const angle = Math.random() * Math.PI * 2;
      const ratio = initialIconRatios[index] ?? { x: 0.5, y: 0.5 };

      return {
        el: icon,
        x: ratio.x * Math.max(width - 60, 1),
        y: ratio.y * Math.max(height - 60, 1),
        vx: Math.cos(angle) * SPEED,
        vy: Math.sin(angle) * SPEED,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.8,
        scale: 0.9 + Math.random() * 0.2,
        scaleDir: Math.random() > 0.5 ? 1 : -1,
      };
    });

    let frame = 0;

    const animate = () => {
      containerRect = container.getBoundingClientRect();
      const width = containerRect.width;
      const height = containerRect.height;

      for (const item of state) {
        const dx = item.x + 30 - mouse.x;
        const dy = item.y + 30 - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < REPEL_RADIUS && distance > 0) {
          const force = ((REPEL_RADIUS - distance) / REPEL_RADIUS) * REPEL_FORCE;
          item.vx += (dx / distance) * force;
          item.vy += (dy / distance) * force;
        }

        item.vx *= 0.98;
        item.vy *= 0.98;

        const speed = Math.sqrt(item.vx * item.vx + item.vy * item.vy);

        if (speed < SPEED * 0.5) {
          const angle = Math.atan2(item.vy, item.vx);
          item.vx = Math.cos(angle) * SPEED * 0.5;
          item.vy = Math.sin(angle) * SPEED * 0.5;
        }

        item.x += item.vx;
        item.y += item.vy;

        if (item.x < 0) {
          item.x = 0;
          item.vx = Math.abs(item.vx);
        }

        if (item.x > width - 60) {
          item.x = width - 60;
          item.vx = -Math.abs(item.vx);
        }

        if (item.y < 0) {
          item.y = 0;
          item.vy = Math.abs(item.vy);
        }

        if (item.y > height - 60) {
          item.y = height - 60;
          item.vy = -Math.abs(item.vy);
        }

        item.rotation += item.rotSpeed;
        item.scale += item.scaleDir * 0.001;

        if (item.scale > 1.1) {
          item.scaleDir = -1;
        }

        if (item.scale < 0.85) {
          item.scaleDir = 1;
        }

        item.el.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg) scale(${item.scale})`;
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(() => {
      containerRect = container.getBoundingClientRect();
      animate();
    });

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-2.5 md:gap-2.5 lg:max-w-6xl lg:flex-row lg:gap-10">
      <div className="mt-2 w-full lg:mt-0 lg:flex-1">
        <span className="mb-1.5 block text-center text-xs font-semibold tracking-widest text-muted-foreground/70 uppercase lg:mb-3">
          Your knowledge today...
        </span>
        <div
          ref={containerRef}
          className="relative h-37.5 overflow-hidden rounded-xl border border-border bg-card sm:h-42 lg:h-80"
        >
          {chaosIcons.map((icon) => (
            <div
              key={icon}
              className="absolute flex size-19 items-center justify-center text-muted-foreground opacity-70 transition-opacity [&_svg]:size-13.5"
              data-chaos-icon="true"
            >
              <ChaosIcon type={icon} />
            </div>
          ))}
        </div>
      </div>

      <div className="my-0.5 flex shrink-0 animate-pulse text-muted-foreground/70 md:mb-1.5 lg:my-0">
        <svg
          className="rotate-90 lg:rotate-0"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      <div className="mb-2.5 w-full lg:mb-0 lg:flex-1">
        <span className="mb-1.5 block text-center text-xs font-semibold tracking-widest text-muted-foreground/70 uppercase lg:mb-3">
          ...with Korax
        </span>
        <div className="flex h-37.5 flex-col overflow-hidden rounded-xl border border-border bg-card sm:h-42 lg:h-80">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
            <div className="h-2 w-24 rounded bg-border" />
            <div className="size-3.5 rounded-full bg-blue-500" />
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="flex w-22.5 shrink-0 flex-col gap-1 border-r border-border bg-muted/40 px-2 py-2.5">
              {sidebarItems.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex cursor-default items-center gap-1.5 rounded px-1.5 py-0.75",
                    index === 0 && "bg-foreground/6",
                  )}
                >
                  <span
                    className="size-1.25 shrink-0 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span
                    className={cn(
                      "text-[0.45rem] leading-none font-medium whitespace-nowrap text-muted-foreground/60",
                      index === 0 && "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 overflow-hidden px-3 py-2.5">
              <div className="text-[0.45rem] font-bold tracking-[0.08em] text-muted-foreground/60 uppercase">
                Collections
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {dashboardCards.slice(0, 4).map((color) => (
                  <DashboardCard key={`collection-${color}`} color={color} />
                ))}
              </div>
              <div className="text-[0.45rem] font-bold tracking-[0.08em] text-muted-foreground/60 uppercase">
                Recent Items
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {dashboardCards.slice(4).map((color, index) => (
                  <DashboardCard key={`item-${index}-${color}`} color={color} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ color }: { color: string }) {
  return (
    <div
      className="flex flex-col gap-1.25 rounded-lg border-t-[3px] border-(--card-color) bg-muted/40 px-2.5 py-2"
      style={{ "--card-color": color } as CSSProperties}
    >
      <div className="h-1.25 w-3/5 rounded-sm bg-muted-foreground/50" />
      <div className="h-0.75 w-[90%] rounded-sm bg-border" />
      <div className="h-0.75 w-1/2 rounded-sm bg-border" />
    </div>
  );
}

function ChaosIcon({ type }: { type: (typeof chaosIcons)[number] }) {
  switch (type) {
    case "notion":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.29c-.42-.326-.98-.7-2.055-.607L3.01 2.89c-.466.046-.56.28-.374.466l1.823 1.852zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.84c-.56.047-.747.327-.747.98zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.607.327-1.166.514-1.633.514-.746 0-.933-.234-1.493-.933l-4.571-7.182v6.95l1.446.327s0 .84-1.166.84l-3.22.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.453-.233 4.759 7.275V9.2l-1.213-.14c-.093-.513.28-.886.746-.933l3.22-.187z" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case "slack":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" />
        </svg>
      );
    case "vscode":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.583 2.002L7.637 10.596 3.213 7.569l-1.21.752v7.358l1.21.752 4.424-3.027 9.946 8.594L22 19.9V4.1l-4.417-2.098zM7.396 14.358L4.542 12l2.854-2.358v4.716zM17.583 17.1l-7.474-5.1 7.474-5.1v10.2z" />
        </svg>
      );
    case "browser":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "terminal":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
    case "textfile":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "bookmark":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
}
