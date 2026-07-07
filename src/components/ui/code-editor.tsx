'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Crown, Loader2, Sparkles } from 'lucide-react';
import type { OnMount } from '@monaco-editor/react';
import type * as MonacoNamespace from 'monaco-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { getCodeEditorLanguage, getCodeEditorWordWrap } from '@/lib/editors/code';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  EditorCopyButton,
  EditorTabButton,
  EditorWindowDots,
} from '@/components/ui/editor-shell';
import { useEditorPreferences } from '@/contexts/editor-preferences-context';

const MonacoEditor = dynamic(
  async () => {
    const mod = await import('@monaco-editor/react');
    return mod.default;
  },
  {
    ssr: false,
    loading: () => (
      <div className='flex h-40 animate-pulse items-center justify-center rounded-b-[1.5rem] bg-[#0f1726] text-sm text-slate-400'>
        Loading editor...
      </div>
    ),
  },
);

const DEFAULT_MAX_HEIGHT = 400;
const DEFAULT_MIN_HEIGHT = 144;
const HEADER_HEIGHT = 53;
const MIN_EDITOR_BODY_HEIGHT = 80;

const markdownComponents = {
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className='mt-0 mb-3 text-lg font-semibold tracking-tight text-slate-50' {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className='mt-5 mb-2 text-base font-semibold tracking-tight text-slate-100' {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className='my-3 text-sm leading-7 text-slate-100' {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className='my-3 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-100' {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className='my-3 list-decimal space-y-1 pl-5 text-sm leading-7 text-slate-100' {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className='text-sm leading-7 text-slate-100' {...props} />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<'code'>) => {
    const isBlock = Boolean(className?.includes('language-'));

    if (isBlock) {
      return <code className={cn('bg-transparent p-0 text-sm leading-6 text-slate-100', className)} {...props} />;
    }

    return (
      <code
        className={cn(
          'rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[0.925em] text-slate-100',
          className,
        )}
        {...props}
      />
    );
  },
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className='my-3 overflow-x-auto rounded-2xl border border-slate-700 bg-[#111827] p-4' {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className='font-semibold text-slate-50' {...props} />
  ),
};

interface CodeEditorProps {
  aiExplanation?: {
    isPending: boolean;
    isPro: boolean;
    onExplain: () => void;
    onViewChange: (view: "code" | "explain") => void;
    view: "code" | "explain";
    value: string | null;
  };
  className?: string;
  id?: string;
  itemType: string;
  language?: string | null;
  maxHeight?: number;
  minHeight?: number;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  showLanguageBadge?: boolean;
  value: string;
}

const clampHeight = (height: number, minHeight: number, maxHeight: number) =>
  Math.min(Math.max(height, minHeight), maxHeight);

export const CodeEditor = ({
  aiExplanation,
  className,
  id,
  itemType,
  language,
  maxHeight = DEFAULT_MAX_HEIGHT,
  minHeight = DEFAULT_MIN_HEIGHT,
  onChange,
  readOnly = false,
  showLanguageBadge = true,
  value,
}: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const editorBodyMinHeight = Math.max(
    Math.min(minHeight - HEADER_HEIGHT, maxHeight - HEADER_HEIGHT),
    MIN_EDITOR_BODY_HEIGHT,
  );
  const editorBodyMaxHeight = Math.max(maxHeight - HEADER_HEIGHT, MIN_EDITOR_BODY_HEIGHT);
  const [editorHeight, setEditorHeight] = useState(editorBodyMinHeight);
  const editorRef = useRef<MonacoNamespace.editor.IStandaloneCodeEditor | null>(null);
  const sizeListenerRef = useRef<MonacoNamespace.IDisposable | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const activeValue =
    aiExplanation?.view === 'explain' && aiExplanation.value
      ? aiExplanation.value
      : value;
  const showExplainTabs = Boolean(aiExplanation?.value);
  const canShowExplainControls = readOnly && Boolean(aiExplanation);

  const { editorLanguage, label } = getCodeEditorLanguage(language, itemType);
  const { preferences } = useEditorPreferences();

  useEffect(() => {
    return () => {
      sizeListenerRef.current?.dispose();

      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    editorRef.current?.layout();
  }, [editorHeight]);

  const syncEditorHeight = () => {
    if (!editorRef.current) {
      return;
    }

    const nextHeight = clampHeight(
      Math.ceil(editorRef.current.getContentHeight()) + 4,
      editorBodyMinHeight,
      editorBodyMaxHeight,
    );

    setEditorHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  };

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    syncEditorHeight();

    sizeListenerRef.current?.dispose();
    sizeListenerRef.current = editor.onDidContentSizeChange(() => {
      syncEditorHeight();
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeValue);
      setCopied(true);
      toast.success('Content copied.');

      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (error) {
      console.error('Failed to copy code editor content.', error);
      toast.error('Unable to copy content.');
    }
  };

  return (
    <div
      className={cn(
        'code-editor-shell overflow-hidden rounded-2xl border border-border/80 bg-[#1f1f1f] shadow-none',
        className,
      )}
    >
      <div className='flex min-h-13.25 items-center justify-between border-b border-border/80 bg-[#303030] px-4 py-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <EditorWindowDots />
          {showLanguageBadge ? (
            <span className='truncate px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase'>
              {label}
            </span>
          ) : null}
          {showExplainTabs ? (
            <div
              className='inline-flex items-center rounded-lg border border-border/80 bg-[#222] p-1'
              role='tablist'
              aria-label='Code explanation view'
            >
              <EditorTabButton
                active={aiExplanation?.view === 'code'}
                rounded='md'
                onClick={() => aiExplanation?.onViewChange('code')}
              >
                Code
              </EditorTabButton>
              <EditorTabButton
                active={aiExplanation?.view === 'explain'}
                rounded='md'
                onClick={() => aiExplanation?.onViewChange('explain')}
              >
                Explain
              </EditorTabButton>
            </div>
          ) : null}
        </div>

        <div className='flex items-center gap-2'>
          {canShowExplainControls ? (
            aiExplanation?.isPro ? (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-8 rounded-lg border border-border/80 bg-[#222] px-2.5 text-muted-foreground hover:bg-[#2a2a2a] hover:text-foreground'
                onClick={aiExplanation.onExplain}
                disabled={!value.trim() || aiExplanation.isPending}
                aria-label='Explain code'
              >
                {aiExplanation.isPending ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Sparkles className='size-4' />
                )}
                {aiExplanation.isPending ? 'Explaining...' : 'Explain'}
              </Button>
            ) : (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                title='AI features require Pro subscription'
                className='h-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 text-amber-200 hover:bg-amber-500/15 hover:text-amber-100'
                onClick={() => aiExplanation?.onExplain()}
                aria-label='AI features require Pro subscription'
              >
                <Crown className='size-4' />
                Pro
              </Button>
            )
          ) : null}
          <EditorCopyButton
            copied={copied}
            disabled={!activeValue.trim()}
            className='border-border/80 bg-[#222] text-muted-foreground hover:bg-[#2a2a2a] hover:text-foreground'
            onCopy={() => {
              void handleCopy();
            }}
          />
        </div>
      </div>

      {aiExplanation?.view === 'explain' && aiExplanation.value ? (
        <div
          id={id}
          className='overflow-y-auto px-5 py-4'
          style={{
            maxHeight: editorBodyMaxHeight,
            minHeight: editorBodyMinHeight,
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {aiExplanation.value}
          </ReactMarkdown>
        </div>
      ) : (
        <MonacoEditor
          height={`${editorHeight}px`}
          language={editorLanguage}
          loading={null}
          onChange={(nextValue) => {
            onChange?.(nextValue ?? '');
          }}
          onMount={handleMount}
          options={{
            automaticLayout: true,
            contextmenu: !readOnly,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            domReadOnly: readOnly,
            fixedOverflowWidgets: true,
            folding: false,
            fontSize: preferences.fontSize,
            glyphMargin: false,
            lineDecorationsWidth: 10,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            minimap: { enabled: preferences.minimap },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            padding: { top: 16, bottom: 16 },
            readOnly,
            renderLineHighlight: 'all',
            renderValidationDecorations: 'off',
            scrollBeyondLastLine: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
              horizontalScrollbarSize: 10,
              useShadows: false,
              verticalScrollbarSize: 10,
            },
            smoothScrolling: true,
            stickyScroll: { enabled: false },
            tabSize: preferences.tabSize,
            wordWrap: getCodeEditorWordWrap(preferences.wordWrap),
          }}
          theme='vs-dark'
          value={value}
          width='100%'
          wrapperProps={{
            id,
          }}
        />
      )}
    </div>
  );
};
