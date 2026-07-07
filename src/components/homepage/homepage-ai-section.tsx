import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const syntaxClasses = {
  keyword: "text-[#c678dd]",
  function: "text-[#61afef]",
  type: "text-[#e5c07b]",
  param: "text-[#e06c75]",
  punctuation: "text-muted-foreground",
} as const;

const checklist = [
  "Auto-tag suggestions based on content",
  "AI-generated summaries for long snippets",
  "Explain This Code one-click breakdowns",
  "Prompt optimizer for better AI results",
] as const;

const codeLines = [
  {
    line: "1",
    content: (
      <>
        <span className={syntaxClasses.keyword}>export</span>{" "}
        <span className={syntaxClasses.keyword}>function</span>{" "}
        <span className={syntaxClasses.function}>useDebounce</span>
        <span className={syntaxClasses.punctuation}>&lt;</span>
        <span className={syntaxClasses.type}>T</span>
        <span className={syntaxClasses.punctuation}>&gt;(</span>
      </>
    ),
  },
  {
    line: "2",
    content: (
      <>
        <span className={syntaxClasses.param}>value</span>:{" "}
        <span className={syntaxClasses.type}>T</span>,
      </>
    ),
  },
  {
    line: "3",
    content: (
      <>
        <span className={syntaxClasses.param}>delay</span>:{" "}
        <span className={syntaxClasses.type}>number</span>
      </>
    ),
  },
  {
    line: "4",
    content: (
      <>
        <span className={syntaxClasses.punctuation}>):</span>{" "}
        <span className={syntaxClasses.type}>T</span>{" "}
        <span className={syntaxClasses.punctuation}>{"{"}</span>
      </>
    ),
  },
  {
    line: "5",
    content: (
      <>
        <span className={syntaxClasses.keyword}>const</span> [debounced, setDebounced] =
      </>
    ),
  },
  {
    line: "6",
    content: (
      <>
        <span className={syntaxClasses.function}>useState</span>
        <span className={syntaxClasses.punctuation}>(</span>
        <span className={syntaxClasses.param}>value</span>
        <span className={syntaxClasses.punctuation}>);</span>
      </>
    ),
  },
  { line: "7", content: <></> },
  {
    line: "8",
    content: (
      <>
        <span className={syntaxClasses.function}>useEffect</span>
        <span className={syntaxClasses.punctuation}>{"(() => {"}</span>
      </>
    ),
  },
  {
    line: "9",
    content: (
      <>
        <span className={syntaxClasses.keyword}>const</span> t ={" "}
        <span className={syntaxClasses.function}>setTimeout</span>
        <span className={syntaxClasses.punctuation}>{"(() =>"}</span>
      </>
    ),
  },
  {
    line: "10",
    content: (
      <>
        <span className={syntaxClasses.function}>setDebounced</span>
        <span className={syntaxClasses.punctuation}>(</span>
        <span className={syntaxClasses.param}>value</span>
        <span className={syntaxClasses.punctuation}>),</span>{" "}
        <span className={syntaxClasses.param}>delay</span>
        <span className={syntaxClasses.punctuation}>);</span>
      </>
    ),
  },
  {
    line: "11",
    content: (
      <>
        <span className={syntaxClasses.keyword}>return</span>{" "}
        <span className={syntaxClasses.punctuation}>{"() =>"}</span>{" "}
        <span className={syntaxClasses.function}>clearTimeout</span>
        <span className={syntaxClasses.punctuation}>(t);</span>
      </>
    ),
  },
  {
    line: "12",
    content: (
      <>
        <span className={syntaxClasses.punctuation}>{"}, ["}</span>
        <span className={syntaxClasses.param}>value</span>,{" "}
        <span className={syntaxClasses.param}>delay</span>
        <span className={syntaxClasses.punctuation}>{" ]);"}</span>
      </>
    ),
  },
  { line: "13", content: <></> },
  {
    line: "14",
    content: (
      <>
        <span className={syntaxClasses.keyword}>return</span> debounced;
      </>
    ),
  },
  {
    line: "15",
    content: <span className={syntaxClasses.punctuation}>{"}"}</span>,
  },
] as const;

export function HomepageAiSection() {
  return (
    <section className="py-14 md:py-18 lg:pt-30 lg:pb-18" id="ai">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div>
            <Badge className="mb-5 bg-linear-to-br from-amber-500 to-orange-500 font-bold text-black uppercase tracking-wide">
              Pro Feature
            </Badge>
            <h2 className="mb-2 text-3xl leading-tight font-extrabold tracking-normal sm:text-4xl lg:mb-4 lg:text-[2.8rem]">
              AI-Powered
              <br />
              <span className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                Productivity
              </span>
            </h2>
            <p className="mb-8 max-w-xl text-[0.95rem] leading-7 text-muted-foreground md:text-[1.05rem]">
              Let AI handle the busywork so you can focus on building.
            </p>
            <ul className="flex list-none flex-col gap-4">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground sm:text-[0.95rem]">
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Card className="gap-0 overflow-hidden border-border bg-[#12121a] py-0">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
              <div className="flex gap-2">
                <span className="size-3 rounded-full bg-red-500" />
                <span className="size-3 rounded-full bg-amber-500" />
                <span className="size-3 rounded-full bg-green-500" />
              </div>
              <span className="font-mono text-xs text-muted-foreground/70">typescript</span>
            </div>
            <div className="py-3 font-mono text-[0.82rem] leading-6">
              {codeLines.map((line) => (
                <div key={line.line} className="px-4 hover:bg-foreground/3">
                  <span className="mr-4 inline-block w-7 select-none text-right text-muted-foreground/70">
                    {line.line}
                  </span>
                  {line.content}
                </div>
              ))}
            </div>
            <div className="border-t border-border bg-amber-500/4 p-3.5">
              <span className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-500 uppercase">
                <Sparkles className="size-3.5" />
                AI Generated Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {["react", "hooks", "debounce", "typescript", "performance"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="h-auto rounded-full bg-muted/40 px-3 py-1 font-mono text-[0.78rem] text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return <Check className="size-5 shrink-0 text-green-500" strokeWidth={2.5} />;
}
