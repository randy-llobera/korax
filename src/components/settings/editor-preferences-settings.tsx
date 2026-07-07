"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Code2, PanelsTopLeft, WrapText } from "lucide-react";
import { toast } from "sonner";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import {
  EDITOR_FONT_SIZE_OPTIONS,
  EDITOR_TAB_SIZE_OPTIONS,
  type EditorPreferences,
} from "@/lib/editors/preferences";

import { useEditorPreferences } from "@/contexts/editor-preferences-context";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AUTO_SAVE_DELAY_MS = 450;

const CONTROL_HELPERS = {
  fontSize: "Choose the Monaco font size in pixels.",
  minimap: "Show a preview strip for long files.",
  tabSize: "Set how many spaces a tab inserts.",
  theme: "Monaco uses the default dark theme across the app.",
  wordWrap: "Wrap long lines instead of scrolling horizontally.",
} satisfies Record<keyof EditorPreferences, string>;

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const PreferenceToggle = ({
  checked,
  description,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
    onClick={() => onChange(!checked)}
    disabled={disabled}
  >
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </span>
  </button>
);

export const EditorPreferencesSettings = ({
  initialPreferences,
}: {
  initialPreferences: EditorPreferences;
}) => {
  const { preferences, setPreferences } = useEditorPreferences();
  const [isSaving, startTransition] = useTransition();
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const previousPreferencesRef = useRef(initialPreferences);
  const hasPendingSaveRef = useRef(false);

  useEffect(() => {
    if (!hasPendingSaveRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextPreferences = preferences;
      const previousPreferences = previousPreferencesRef.current;

      startTransition(async () => {
        const result = await updateEditorPreferences(nextPreferences);

        if (!result.success || !result.data) {
          hasPendingSaveRef.current = false;
          setPreferences(previousPreferences);
          toast.error(result.error ?? "Unable to save editor preferences.");
          return;
        }

        hasPendingSaveRef.current = false;
        previousPreferencesRef.current = result.data;
        setPreferences(result.data);
        setLastSavedAt(new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }));
        toast.success("Editor preferences saved.");
      });
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [preferences, setPreferences, startTransition]);

  const updatePreference = <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K],
  ) => {
    hasPendingSaveRef.current = true;
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const summaryText = isSaving
    ? "Saving changes..."
    : lastSavedAt
      ? `Last saved at ${lastSavedAt}.`
      : "Changes save automatically.";

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Code2 className="size-4 text-muted-foreground" />
              Editor preferences
            </CardTitle>
            <CardDescription>
              Control how snippet and command editors look and behave across the app.
            </CardDescription>
          </div>
          <p className="text-xs text-muted-foreground">{summaryText}</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="editor-font-size" className="text-sm font-medium">
            Font size
          </label>
          <select
            id="editor-font-size"
            className={selectClassName}
            value={preferences.fontSize}
            onChange={(event) => updatePreference("fontSize", Number(event.target.value) as EditorPreferences["fontSize"])}
            disabled={isSaving}
          >
            {EDITOR_FONT_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}px
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">{CONTROL_HELPERS.fontSize}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="editor-tab-size" className="text-sm font-medium">
            Tab size
          </label>
          <select
            id="editor-tab-size"
            className={selectClassName}
            value={preferences.tabSize}
            onChange={(event) => updatePreference("tabSize", Number(event.target.value) as EditorPreferences["tabSize"])}
            disabled={isSaving}
          >
            {EDITOR_TAB_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} spaces
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">{CONTROL_HELPERS.tabSize}</p>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <WrapText className="size-4 text-muted-foreground" />
            Editor behavior
          </div>
          <PreferenceToggle
            checked={preferences.wordWrap}
            description={CONTROL_HELPERS.wordWrap}
            disabled={isSaving}
            label="Word wrap"
            onChange={(checked) => updatePreference("wordWrap", checked)}
          />
          <PreferenceToggle
            checked={preferences.minimap}
            description={CONTROL_HELPERS.minimap}
            disabled={isSaving}
            label="Minimap"
            onChange={(checked) => updatePreference("minimap", checked)}
          />
        </div>

        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PanelsTopLeft className="size-4 text-muted-foreground" />
            Applied automatically
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Changes apply to the Monaco editor in create and edit flows as soon as they save.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
