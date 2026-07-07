import { LANGUAGE_ITEM_TYPES } from "@/lib/items/form";

const CODE_EDITOR_ITEM_TYPES = new Set<string>(LANGUAGE_ITEM_TYPES);

const LANGUAGE_CHOICES = [
  { value: 'bash', label: 'Bash', editorLanguage: 'shell', aliases: ['bash'] },
  { value: 'c', label: 'C', editorLanguage: 'c', aliases: ['c'] },
  { value: 'c#', label: 'C#', editorLanguage: 'csharp', aliases: ['c#'] },
  { value: 'c++', label: 'C++', editorLanguage: 'cpp', aliases: ['cpp', 'c++'] },
  { value: 'css', label: 'CSS', editorLanguage: 'css', aliases: ['css'] },
  {
    value: 'dockerfile',
    label: 'Dockerfile',
    editorLanguage: 'dockerfile',
    aliases: ['docker', 'dockerfile'],
  },
  { value: 'go', label: 'Go', editorLanguage: 'go', aliases: ['go'] },
  { value: 'html', label: 'HTML', editorLanguage: 'html', aliases: ['html'] },
  { value: 'java', label: 'Java', editorLanguage: 'java', aliases: ['java'] },
  {
    value: 'javascript',
    label: 'JavaScript',
    editorLanguage: 'javascript',
    aliases: ['javascript', 'js'],
  },
  { value: 'json', label: 'JSON', editorLanguage: 'json', aliases: ['json'] },
  {
    value: 'markdown',
    label: 'Markdown',
    editorLanguage: 'markdown',
    aliases: ['markdown', 'md'],
  },
  { value: 'php', label: 'PHP', editorLanguage: 'php', aliases: ['php'] },
  {
    value: 'plaintext',
    label: 'Plain text',
    editorLanguage: 'plaintext',
    aliases: ['plaintext', 'text'],
  },
  {
    value: 'python',
    label: 'Python',
    editorLanguage: 'python',
    aliases: ['python', 'py'],
  },
  { value: 'ruby', label: 'Ruby', editorLanguage: 'ruby', aliases: ['ruby'] },
  { value: 'rust', label: 'Rust', editorLanguage: 'rust', aliases: ['rust', 'rs'] },
  {
    value: 'shell',
    label: 'Shell',
    editorLanguage: 'shell',
    aliases: ['shell', 'sh'],
  },
  { value: 'sql', label: 'SQL', editorLanguage: 'sql', aliases: ['sql', 'postgres'] },
  {
    value: 'typescript',
    label: 'TypeScript',
    editorLanguage: 'typescript',
    aliases: ['typescript', 'ts', 'tsx'],
  },
  { value: 'xml', label: 'XML', editorLanguage: 'xml', aliases: ['xml'] },
  { value: 'yaml', label: 'YAML', editorLanguage: 'yaml', aliases: ['yaml', 'yml'] },
  { value: 'zsh', label: 'Zsh', editorLanguage: 'shell', aliases: ['zsh'] },
] as const;

const LANGUAGE_ALIASES = Object.fromEntries(
  LANGUAGE_CHOICES.flatMap(({ aliases, editorLanguage, label }) =>
    aliases.map((alias) => [alias, { editorLanguage, label }]),
  ),
) as Record<string, { editorLanguage: string; label: string }>;

const normalizeLanguageKey = (value: string) => value.trim().toLowerCase();

export const isCodeEditorItemType = (itemType: string) =>
  CODE_EDITOR_ITEM_TYPES.has(itemType.trim().toLowerCase());

export const getCodeEditorWordWrap = (enabled: boolean) => (enabled ? 'on' : 'off');

export const getCodeEditorLanguageOptions = (currentLanguage?: string | null) => {
  const options = LANGUAGE_CHOICES.map(({ value, label }) => ({ value, label }));
  const normalizedLanguage = currentLanguage ? normalizeLanguageKey(currentLanguage) : '';

  if (!normalizedLanguage || LANGUAGE_ALIASES[normalizedLanguage]) {
    return options;
  }

  return [
    ...options,
    {
      value: currentLanguage!.trim(),
      label: currentLanguage!.trim(),
    },
  ];
};

export const getCodeEditorLanguage = (
  language: string | null | undefined,
  itemType: string | null | undefined,
) => {
  const normalizedLanguage = language ? normalizeLanguageKey(language) : '';

  if (normalizedLanguage) {
    const alias = LANGUAGE_ALIASES[normalizedLanguage];

    return {
      editorLanguage: alias?.editorLanguage ?? 'plaintext',
      label: alias?.label ?? language!.trim(),
    };
  }

  if (itemType?.trim().toLowerCase() === 'command') {
    return {
      editorLanguage: 'shell',
      label: 'Shell',
    };
  }

  return {
    editorLanguage: 'plaintext',
    label: 'Plain text',
  };
};
