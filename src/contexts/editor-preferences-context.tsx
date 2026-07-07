"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/lib/editors/preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  setPreferences: (preferences: EditorPreferences) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

interface EditorPreferencesProviderProps {
  children: ReactNode;
  initialPreferences?: EditorPreferences;
}

export const EditorPreferencesProvider = ({
  children,
  initialPreferences = DEFAULT_EDITOR_PREFERENCES,
}: EditorPreferencesProviderProps) => {
  const [preferences, setPreferences] = useState<EditorPreferences>(initialPreferences);

  const contextValue = useMemo<EditorPreferencesContextValue>(
    () => ({
      preferences,
      setPreferences,
    }),
    [preferences],
  );

  return (
    <EditorPreferencesContext.Provider value={contextValue}>
      {children}
    </EditorPreferencesContext.Provider>
  );
};

export const useEditorPreferences = () => {
  const context = useContext(EditorPreferencesContext);

  if (!context) {
    throw new Error(
      "useEditorPreferences must be used within an EditorPreferencesProvider.",
    );
  }

  return context;
};
