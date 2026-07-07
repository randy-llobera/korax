'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

import {
  EditorCopyButton,
  EditorTabButton,
  EditorWindowDots,
} from '@/components/ui/editor-shell';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_MAX_HEIGHT = 400;
const DEFAULT_MIN_HEIGHT = 144;
const HEADER_HEIGHT = 53;
const MARKDOWN_LABEL = 'Markdown';
const BODY_PADDING_OFFSET = 24;
const MIN_EDITOR_BODY_HEIGHT = 80;

const markdownComponents = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className='mt-0 mb-4 text-3xl font-semibold tracking-tight text-slate-50' {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className='mt-6 mb-4 text-2xl font-semibold tracking-tight text-slate-50' {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className='mt-6 mb-3 text-xl font-semibold tracking-tight text-slate-50' {...props} />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4 className='mt-5 mb-3 text-lg font-semibold tracking-tight text-slate-50' {...props} />
  ),
  h5: (props: ComponentPropsWithoutRef<'h5'>) => (
    <h5 className='mt-5 mb-2 text-base font-semibold text-slate-50' {...props} />
  ),
  h6: (props: ComponentPropsWithoutRef<'h6'>) => (
    <h6 className='mt-5 mb-2 text-sm font-semibold tracking-[0.14em] text-slate-300 uppercase' {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className='my-4 text-sm leading-7 text-slate-100' {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className='my-4 list-disc space-y-1 pl-6 text-sm leading-7 text-slate-100' {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className='my-4 list-decimal space-y-1 pl-6 text-sm leading-7 text-slate-100' {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className='text-sm leading-7 text-slate-100' {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className='my-4 border-l-4 border-sky-500/60 bg-slate-900/50 py-1 pr-4 pl-4 text-sm leading-7 text-slate-300 italic'
      {...props}
    />
  ),
  a: ({ className, ...props }: ComponentPropsWithoutRef<'a'>) => (
    <a
      {...props}
      target='_blank'
      rel='noreferrer'
      className={cn(
        'wrap-break-word font-medium text-sky-400 underline underline-offset-4 transition-colors hover:text-sky-300',
        className,
      )}
    />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<'code'>) => {
    const isBlock = Boolean(className?.includes('language-'));

    if (isBlock) {
      return (
        <code
          className={cn('bg-transparent p-0 text-sm leading-6 text-slate-100', className)}
          {...props}
        />
      );
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
    <pre
      className='my-4 overflow-x-auto rounded-2xl border border-slate-700 bg-[#111827] p-4'
      {...props}
    />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className='my-4 overflow-x-auto'>
      <table
        className='w-full overflow-hidden rounded-xl border border-slate-700 text-left text-sm'
        {...props}
      />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<'thead'>) => (
    <thead className='bg-slate-800/80' {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th
      className='border border-slate-700 px-3 py-2 align-top font-semibold text-slate-50'
      {...props}
    />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className='border border-slate-700 px-3 py-2 align-top text-slate-200' {...props} />
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => <hr className='my-4 border-slate-700' {...props} />,
  input: (props: ComponentPropsWithoutRef<'input'>) => (
    <input className='mr-2 translate-y-px' {...props} />
  ),
};

type MarkdownEditorTab = 'write' | 'preview';
type MarkdownEditorReadOnlyTab = 'current' | 'optimized';

interface MarkdownEditorProps {
  className?: string;
  headerActions?: ReactNode;
  id?: string;
  maxHeight?: number;
  minHeight?: number;
  onChange?: (value: string) => void;
  onReadOnlyViewChange?: (view: MarkdownEditorReadOnlyTab) => void;
  placeholder?: string;
  readOnly?: boolean;
  readOnlyView?: MarkdownEditorReadOnlyTab;
  readOnlyViewLabels?: {
    current: string;
    optimized: string;
  };
  value: string;
}

export const MarkdownEditor = ({
  className,
  headerActions,
  id,
  maxHeight = DEFAULT_MAX_HEIGHT,
  minHeight = DEFAULT_MIN_HEIGHT,
  onChange,
  onReadOnlyViewChange,
  placeholder,
  readOnly = false,
  readOnlyView = 'current',
  readOnlyViewLabels = {
    current: 'Current',
    optimized: 'Optimized',
  },
  value,
}: MarkdownEditorProps) => {
  const fallbackId = useId();
  const editorId = id ?? fallbackId;
  const writeTabId = `${editorId}-write-tab`;
  const previewTabId = `${editorId}-preview-tab`;
  const writePanelId = `${editorId}-write-panel`;
  const previewPanelId = `${editorId}-preview-panel`;
  const [editableTab, setEditableTab] = useState<MarkdownEditorTab>('write');
  const [copied, setCopied] = useState(false);
  const activeTab = readOnly ? 'preview' : editableTab;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [bodyHeight, setBodyHeight] = useState(() =>
    Math.max(minHeight - HEADER_HEIGHT, MIN_EDITOR_BODY_HEIGHT),
  );

  const bodyMinHeight = Math.max(minHeight - HEADER_HEIGHT, MIN_EDITOR_BODY_HEIGHT);
  const bodyMaxHeight = Math.max(maxHeight - HEADER_HEIGHT, bodyMinHeight);

  useEffect(() => {
    let timeoutId: number | null = null;

    if (copied) {
      timeoutId = window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [copied]);

  useLayoutEffect(() => {
    const nextHeight = (() => {
      if (readOnly || activeTab === 'preview') {
        const previewElement = previewRef.current;

        if (!previewElement) {
          return bodyMinHeight;
        }

        return Math.ceil(previewElement.scrollHeight);
      }

      const textareaElement = textareaRef.current;

      if (!textareaElement) {
        return bodyMinHeight;
      }

      return Math.ceil(textareaElement.scrollHeight) + BODY_PADDING_OFFSET;
    })();

    const clampedHeight = Math.min(Math.max(nextHeight, bodyMinHeight), bodyMaxHeight);

    setBodyHeight((currentHeight) =>
      currentHeight === clampedHeight ? currentHeight : clampedHeight,
    );
  }, [activeTab, bodyMaxHeight, bodyMinHeight, readOnly, value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Content copied.');
    } catch (error) {
      console.error('Failed to copy markdown editor content.', error);
      toast.error('Unable to copy content.');
    }
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[1.6rem] border border-[#3a3a3a] bg-[#1e1e1e] shadow-[0_18px_45px_-28px_rgba(0,0,0,0.7)]',
        className,
      )}
    >
      <div className='flex min-h-13.25 items-center justify-between border-b border-[#3a3a3a] bg-[#2d2d2d] px-4 py-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <EditorWindowDots />

          {readOnly ? (
            onReadOnlyViewChange ? (
              <div
                className='flex items-center gap-1 rounded-full border border-[#4b5563] bg-[#1e1e1e] p-1'
                role='tablist'
                aria-label='Prompt optimization views'
              >
                <EditorTabButton
                  active={readOnlyView === 'current'}
                  onClick={() => onReadOnlyViewChange('current')}
                >
                  {readOnlyViewLabels.current}
                </EditorTabButton>
                <EditorTabButton
                  active={readOnlyView === 'optimized'}
                  onClick={() => onReadOnlyViewChange('optimized')}
                >
                  {readOnlyViewLabels.optimized}
                </EditorTabButton>
              </div>
            ) : (
              <span className='truncate rounded-full border border-[#4b5563] bg-[#1e1e1e] px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-slate-200 uppercase'>
                {MARKDOWN_LABEL}
              </span>
            )
          ) : (
            <div
              className='flex items-center gap-1 rounded-full border border-[#4b5563] bg-[#1e1e1e] p-1'
              role='tablist'
              aria-label='Markdown editor tabs'
            >
              <EditorTabButton
                id={writeTabId}
                controls={writePanelId}
                active={activeTab === 'write'}
                onClick={() => setEditableTab('write')}
              >
                Write
              </EditorTabButton>
              <EditorTabButton
                id={previewTabId}
                controls={previewPanelId}
                active={activeTab === 'preview'}
                onClick={() => setEditableTab('preview')}
              >
                Preview
              </EditorTabButton>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {headerActions}
          <EditorCopyButton
            copied={copied}
            disabled={!value.trim()}
            onCopy={() => {
              void handleCopy();
            }}
          />
        </div>
      </div>

      <div style={{ height: bodyHeight }}>
        {readOnly || activeTab === 'preview' ? (
          <div
            id={previewPanelId}
            role='tabpanel'
            aria-labelledby={readOnly ? undefined : previewTabId}
            className='overflow-y-auto bg-[#1e1e1e] px-5 py-4'
            style={{ height: bodyHeight }}
          >
            {value.trim() ? (
              <div ref={previewRef}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <p className='text-sm leading-6 text-slate-400'>Nothing to preview yet.</p>
            )}
          </div>
        ) : null}

        {!readOnly && activeTab === 'write' ? (
          <div
            id={writePanelId}
            role='tabpanel'
            aria-labelledby={writeTabId}
            className='bg-[#1e1e1e]'
          >
            <Textarea
              id={editorId}
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange?.(event.target.value)}
              placeholder={placeholder}
              className='min-h-full resize-none rounded-none border-0 bg-[#1e1e1e] px-5 py-4 font-mono text-sm leading-6 text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:border-transparent focus-visible:ring-0'
              style={{ height: bodyHeight - BODY_PADDING_OFFSET }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
