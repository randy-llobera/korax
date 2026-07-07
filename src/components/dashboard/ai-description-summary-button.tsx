'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { generateDescriptionSummary } from '@/actions/ai';

import { Button } from '@/components/ui/button';

interface AiDescriptionSummaryButtonProps {
  content?: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
  inputId: string;
  isPro: boolean;
  itemType: string;
  language?: string;
  title: string;
  url?: string;
  onSummaryChange: (value: string) => void;
}

export const AiDescriptionSummaryButton = ({
  content,
  description,
  fileName,
  fileSize,
  inputId,
  isPro,
  itemType,
  language,
  title,
  url,
  onSummaryChange,
}: AiDescriptionSummaryButtonProps) => {
  const [isPending, setIsPending] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim() && !description?.trim() && !content?.trim() && !url?.trim() && !fileName?.trim()) {
      toast.error('Add a title, content, URL, or file before generating a description.');
      return;
    }

    setIsPending(true);

    const result = await generateDescriptionSummary({
      content,
      description,
      fileName,
      fileSize,
      itemType,
      language,
      title,
      url,
    });

    setIsPending(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? 'Unable to generate a description.');
      return;
    }

    onSummaryChange(result.data.summary);
    toast.success('Description generated.');
  };

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <label className='text-sm font-medium' htmlFor={inputId}>
        Description
      </label>
      {isPro ? (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-8 px-2'
          disabled={isPending}
          onClick={() => {
            void handleGenerate();
          }}
        >
          <Sparkles className='mr-2 size-4' />
          {isPending ? 'Generating...' : 'Generate Summary'}
        </Button>
      ) : null}
    </div>
  );
};
