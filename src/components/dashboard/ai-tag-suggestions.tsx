'use client';

import { useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { generateAutoTags } from '@/actions/ai';
import { parseItemTagsInput } from '@/lib/items/form';

import { Button } from '@/components/ui/button';

interface AiTagSuggestionsProps {
  content?: string;
  description?: string;
  inputId: string;
  isPro: boolean;
  itemType: string;
  language?: string;
  tagsValue: string;
  title: string;
  url?: string;
  onTagsChange: (value: string) => void;
}

const stringifyTags = (tags: string[]) => tags.join(', ');

const mergeAcceptedTag = (tagsValue: string, tag: string) => {
  const nextTags = Array.from(new Set([...parseItemTagsInput(tagsValue), tag]));
  return stringifyTags(nextTags);
};

export const AiTagSuggestions = ({
  content,
  description,
  inputId,
  isPro,
  itemType,
  language,
  tagsValue,
  title,
  url,
  onTagsChange,
}: AiTagSuggestionsProps) => {
  const [isPending, setIsPending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSuggest = async () => {
    if (!title.trim() && !description?.trim() && !content?.trim() && !url?.trim()) {
      toast.error('Add a title or content before requesting tag suggestions.');
      return;
    }

    setIsPending(true);

    const result = await generateAutoTags({
      content,
      description,
      itemType,
      language,
      tags: parseItemTagsInput(tagsValue),
      title,
      url,
    });

    setIsPending(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? 'Unable to suggest tags.');
      return;
    }

    setSuggestions(result.data.tags);
  };

  const handleAccept = (tag: string) => {
    onTagsChange(mergeAcceptedTag(tagsValue, tag));
    setSuggestions((current) => current.filter((value) => value !== tag));
  };

  const handleReject = (tag: string) => {
    setSuggestions((current) => current.filter((value) => value !== tag));
  };

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <label className='text-sm font-medium' htmlFor={inputId}>
          Tags
        </label>
        {isPro ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-8 px-2'
            disabled={isPending}
            onClick={() => {
              void handleSuggest();
            }}
          >
            <Sparkles className='mr-2 size-4' />
            {isPending ? 'Suggesting...' : 'Suggest Tags'}
          </Button>
        ) : null}
      </div>

      {isPro && suggestions.length > 0 ? (
        <div id='ai-tag-suggestions' className='flex flex-wrap gap-2'>
          {suggestions.map((tag) => (
            <div
              key={tag}
              className='inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/35 px-3 py-1 text-sm'
            >
              <span>#{tag}</span>
              <button
                type='button'
                className='rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground'
                aria-label={`Accept suggested tag ${tag}`}
                onClick={() => handleAccept(tag)}
              >
                <Check className='size-3.5' />
              </button>
              <button
                type='button'
                className='rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground'
                aria-label={`Reject suggested tag ${tag}`}
                onClick={() => handleReject(tag)}
              >
                <X className='size-3.5' />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
