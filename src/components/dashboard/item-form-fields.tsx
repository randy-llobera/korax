'use client';

import { ChevronsUpDown } from 'lucide-react';

import {
  getDefaultCodeLanguageLabel,
  getItemContentPlaceholder,
} from '@/lib/items/form';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { AiDescriptionSummaryButton } from '@/components/dashboard/ai-description-summary-button';
import { AiTagSuggestions } from '@/components/dashboard/ai-tag-suggestions';
import { CodeEditor } from '@/components/ui/code-editor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Textarea } from '@/components/ui/textarea';

const dropdownTriggerClassName =
  'h-10 justify-between rounded-xl border-border/80 bg-[#121212] px-3 text-sm font-medium text-foreground shadow-none hover:bg-[#171717]';
const LANGUAGE_DEFAULT_VALUE = '__default';

export const FieldErrorText = ({ errors }: { errors?: string[] }) => {
  if (!errors?.length) {
    return null;
  }

  return <p className='text-sm text-destructive'>{errors[0]}</p>;
};

interface ItemTitleFieldProps {
  autoFocus?: boolean;
  errors?: string[];
  id: string;
  onChange: (value: string) => void;
  value: string;
}

export const ItemTitleField = ({
  autoFocus = false,
  errors,
  id,
  onChange,
  value,
}: ItemTitleFieldProps) => (
  <div className='space-y-3'>
    <label className='block text-sm font-medium' htmlFor={id}>
      Title
    </label>
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder='Give this item a clear name'
      autoFocus={autoFocus}
      aria-invalid={errors ? 'true' : 'false'}
    />
    <FieldErrorText errors={errors} />
  </div>
);

interface ItemDescriptionFieldProps {
  content: string;
  description: string;
  errors?: string[];
  fileName?: string;
  fileSize?: number;
  id: string;
  isPro: boolean;
  itemType: string;
  language: string;
  onChange: (value: string) => void;
  title: string;
  url: string;
}

export const ItemDescriptionField = ({
  content,
  description,
  errors,
  fileName,
  fileSize,
  id,
  isPro,
  itemType,
  language,
  onChange,
  title,
  url,
}: ItemDescriptionFieldProps) => (
  <div className='space-y-2'>
    <AiDescriptionSummaryButton
      content={content}
      description={description}
      fileName={fileName}
      fileSize={fileSize}
      inputId={id}
      isPro={isPro}
      itemType={itemType}
      language={language}
      title={title}
      url={url}
      onSummaryChange={onChange}
    />
    <Textarea
      id={id}
      value={description}
      onChange={(event) => onChange(event.target.value)}
      placeholder='Add optional context or a short summary'
      className='min-h-24'
    />
    <FieldErrorText errors={errors} />
  </div>
);

interface ItemTagsFieldProps {
  content: string;
  description: string;
  errors?: string[];
  id: string;
  isPro: boolean;
  itemType: string;
  language: string;
  onChange: (value: string) => void;
  tagsValue: string;
  title: string;
  url: string;
}

export const ItemTagsField = ({
  content,
  description,
  errors,
  id,
  isPro,
  itemType,
  language,
  onChange,
  tagsValue,
  title,
  url,
}: ItemTagsFieldProps) => (
  <div className='space-y-2'>
    <AiTagSuggestions
      content={content}
      description={description}
      inputId={id}
      isPro={isPro}
      itemType={itemType}
      language={language}
      tagsValue={tagsValue}
      title={title}
      url={url}
      onTagsChange={onChange}
    />
    <Input
      id={id}
      value={tagsValue}
      onChange={(event) => onChange(event.target.value)}
      placeholder='react, prisma, auth'
    />
    <p className='text-sm text-muted-foreground'>Separate tags with commas.</p>
    <FieldErrorText errors={errors} />
  </div>
);

interface ItemLanguageDropdownProps {
  errors?: string[];
  id: string;
  itemType: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export const ItemLanguageDropdown = ({
  errors,
  id,
  itemType,
  onChange,
  options,
  value,
}: ItemLanguageDropdownProps) => {
  const defaultLabel = getDefaultCodeLanguageLabel(itemType);
  const selectedLabel =
    value === ''
      ? defaultLabel
      : (options.find((option) => option.value === value)?.label ?? value);

  return (
    <div className='space-y-3'>
      <label className='block text-sm font-medium' htmlFor={id}>
        Language
      </label>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={id}
              type='button'
              variant='outline'
              className={cn(dropdownTriggerClassName, 'w-fit min-w-40 gap-3')}
              aria-invalid={errors ? 'true' : 'false'}
            >
              <span className='truncate'>{selectedLabel}</span>
              <ChevronsUpDown className='size-4 shrink-0 text-muted-foreground' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            className='max-h-72 w-56 overflow-y-auto'
          >
            <DropdownMenuRadioGroup
              value={value || LANGUAGE_DEFAULT_VALUE}
              onValueChange={(nextValue) =>
                onChange(nextValue === LANGUAGE_DEFAULT_VALUE ? '' : nextValue)
              }
            >
              <DropdownMenuRadioItem value={LANGUAGE_DEFAULT_VALUE}>
                {defaultLabel}
              </DropdownMenuRadioItem>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FieldErrorText errors={errors} />
    </div>
  );
};

interface ItemContentFieldProps {
  errors?: string[];
  id: string;
  isCodeEditor: boolean;
  isMarkdownEditor: boolean;
  itemType: string;
  language: string;
  onChange: (value: string) => void;
  value: string;
}

export const ItemContentField = ({
  errors,
  id,
  isCodeEditor,
  isMarkdownEditor,
  itemType,
  language,
  onChange,
  value,
}: ItemContentFieldProps) => (
  <div className='space-y-3'>
    <label className='block text-sm font-medium' htmlFor={id}>
      Content
    </label>
    {isCodeEditor ? (
      <CodeEditor
        id={id}
        itemType={itemType}
        language={language}
        showLanguageBadge={false}
        value={value}
        onChange={onChange}
      />
    ) : isMarkdownEditor ? (
      <MarkdownEditor
        id={id}
        value={value}
        onChange={onChange}
        placeholder={getItemContentPlaceholder(itemType)}
      />
    ) : (
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={getItemContentPlaceholder(itemType)}
        className='min-h-48 font-mono text-sm'
      />
    )}
    <FieldErrorText errors={errors} />
  </div>
);

interface ItemTextInputFieldProps {
  errors?: string[];
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}

export const ItemTextInputField = ({
  errors,
  id,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: ItemTextInputFieldProps) => (
  <div className='space-y-3'>
    <label className='block text-sm font-medium' htmlFor={id}>
      {label}
    </label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-invalid={errors ? 'true' : 'false'}
    />
    <FieldErrorText errors={errors} />
  </div>
);
