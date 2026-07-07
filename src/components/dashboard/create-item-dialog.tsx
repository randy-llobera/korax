'use client';

import {
  createElement,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

import { createItem, type CreateItemActionError } from '@/actions/items';
import type { CollectionOption } from '@/lib/db/collections';
import {
  isFileUploadItemType,
  type FileUploadItemType,
} from '@/lib/files/upload';
import {
  buildCreateItemPayload,
  ItemFormType,
  ITEM_FORM_TYPES,
  isFileItemType,
  getItemFormCapabilities,
  parseItemTagsInput,
  resetItemFormValuesForType,
  isUrlItemType,
} from '@/lib/items/form';
import { getItemTypeHref } from '@/lib/items/navigation';
import type { SidebarItemType } from '@/lib/db/items';
import {
  getCodeEditorLanguageOptions,
  isCodeEditorItemType,
} from '@/lib/editors/code';
import { isMarkdownEditorItemType } from '@/lib/editors/markdown';

import { cn } from '@/lib/utils';

import { FileUpload } from '@/components/dashboard/file-upload';
import { CollectionPicker } from '@/components/dashboard/collection-picker';
import {
  FieldErrorText,
  ItemContentField,
  ItemDescriptionField,
  ItemLanguageDropdown,
  ItemTagsField,
  ItemTextInputField,
  ItemTitleField,
} from '@/components/dashboard/item-form-fields';
import { useSearch } from '@/components/dashboard/search-provider';
import { getItemTypeIcon } from '@/components/utils/item-type';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CreateItemType = ItemFormType;

const TYPE_LABELS: Record<CreateItemType, string> = {
  snippet: 'Snippet',
  prompt: 'Prompt',
  command: 'Command',
  note: 'Note',
  file: 'File',
  image: 'Image',
  link: 'Link',
};
const TYPE_ICON_FALLBACKS: Record<CreateItemType, string> = {
  snippet: 'Code',
  prompt: 'Sparkles',
  command: 'Terminal',
  note: 'StickyNote',
  file: 'File',
  image: 'Image',
  link: 'Link',
};
const TYPE_SLUGS: Record<CreateItemType, string> = {
  snippet: 'snippets',
  prompt: 'prompts',
  command: 'commands',
  note: 'notes',
  file: 'files',
  image: 'images',
  link: 'links',
};

interface CreateItemDialogProps {
  collections: CollectionOption[];
  isPro: boolean;
  itemTypes: SidebarItemType[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface CreateItemFormState {
  itemType: CreateItemType;
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
  collectionIds: string[];
}

type CreateItemFormField = keyof CreateItemFormState;
type CreateItemFormErrors = Partial<Record<CreateItemFormField, string[]>>;

interface UploadedFilePayload {
  fileName: string;
  fileSize: number;
  fileUrl: string;
}

const INITIAL_FORM_STATE: CreateItemFormState = {
  itemType: 'snippet',
  title: '',
  description: '',
  tags: '',
  content: '',
  language: '',
  url: '',
  collectionIds: [],
};

const dropdownTriggerClassName =
  'h-10 justify-between rounded-xl border-border/80 bg-[#121212] px-3 text-sm font-medium text-foreground shadow-none hover:bg-[#171717]';

interface TypeOption {
  disabled?: boolean;
  color?: string;
  icon: string;
  label: string;
  value: CreateItemType;
}

const uploadSelectedFile = (
  file: File,
  itemType: FileUploadItemType,
  onProgress: (value: number) => void,
) =>
  new Promise<UploadedFilePayload>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('itemType', itemType);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/uploads');
    request.responseType = 'json';
    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () => {
      const response =
        typeof request.response === 'object' && request.response
          ? request.response
          : JSON.parse(request.responseText || '{}');

      if (request.status >= 200 && request.status < 300) {
        resolve(response as UploadedFilePayload);
        return;
      }

      reject(
        new Error(
          (response as { error?: string }).error ?? 'Unable to upload file.',
        ),
      );
    });
    request.addEventListener('error', () => {
      reject(new Error('Unable to upload file.'));
    });
    request.send(formData);
  });

const cleanupUploadedFile = async (fileUrl: string) => {
  await fetch('/api/uploads', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileUrl }),
  });
};

interface CreateItemTypePickerProps {
  fieldErrors: CreateItemFormErrors;
  formState: CreateItemFormState;
  isPro: boolean;
  onTypeChange: (itemType: CreateItemType) => void;
  typeOptions: TypeOption[];
}

const CreateItemTypePicker = ({
  fieldErrors,
  formState,
  isPro,
  onTypeChange,
  typeOptions,
}: CreateItemTypePickerProps) => {
  const selectedOption =
    typeOptions.find((option) => option.value === formState.itemType) ??
    typeOptions[0]!;

  return (
    <div className='space-y-3'>
      <label className='block text-sm font-medium' htmlFor='item-type-selector'>
        Type
      </label>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id='item-type-selector'
              type='button'
              variant='outline'
              className={cn(dropdownTriggerClassName, 'w-fit min-w-44 gap-3')}
              aria-invalid={fieldErrors.itemType ? 'true' : 'false'}
            >
              <span className='flex min-w-0 items-center gap-3'>
                <span
                  className='text-primary'
                  style={
                    selectedOption.color
                      ? { color: selectedOption.color }
                      : undefined
                  }
                >
                  {createElement(getItemTypeIcon(selectedOption.icon), {
                    className: 'size-4',
                  })}
                </span>
                <span className='truncate'>{selectedOption.label}</span>
              </span>
              <ChevronsUpDown className='size-4 shrink-0 text-muted-foreground' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-64'>
            <DropdownMenuRadioGroup
              value={formState.itemType}
              onValueChange={(value) => onTypeChange(value as CreateItemType)}
            >
              {typeOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className='gap-3'
                >
                  <span
                    className='text-primary'
                    style={option.color ? { color: option.color } : undefined}
                  >
                    {createElement(getItemTypeIcon(option.icon), {
                      className: 'size-4',
                    })}
                  </span>
                  <span className='flex-1'>{option.label}</span>
                  {option.disabled ? (
                    <span className='text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase'>
                      Pro
                    </span>
                  ) : null}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!isPro ? (
        <p className='text-sm text-muted-foreground'>
          File and image items require Pro. See the{' '}
          <Link
            href={getItemTypeHref('files')}
            className='font-medium text-primary hover:text-primary/80'
          >
            Files
          </Link>{' '}
          and{' '}
          <Link
            href={getItemTypeHref('images')}
            className='font-medium text-primary hover:text-primary/80'
          >
            Images
          </Link>{' '}
          pages to upgrade.
        </p>
      ) : null}
      <FieldErrorText errors={fieldErrors.itemType} />
    </div>
  );
};

interface CreateItemMainFieldsProps {
  fieldErrors: CreateItemFormErrors;
  formState: CreateItemFormState;
  isPro: boolean;
  selectedFile: File | null;
  onFieldChange: <T extends CreateItemFormField>(
    field: T,
    value: CreateItemFormState[T],
  ) => void;
}

const CreateItemMainFields = ({
  fieldErrors,
  formState,
  isPro,
  selectedFile,
  onFieldChange,
}: CreateItemMainFieldsProps) => (
  <>
    <div className='sm:col-span-2'>
      <ItemTitleField
        id='create-item-title'
        value={formState.title}
        onChange={(value) => onFieldChange('title', value)}
        errors={fieldErrors.title}
      />
    </div>

    <div className='sm:col-span-2'>
      <ItemDescriptionField
        content={formState.content}
        description={formState.description}
        errors={fieldErrors.description}
        fileName={selectedFile?.name}
        fileSize={selectedFile?.size}
        id='create-item-description'
        isPro={isPro}
        itemType={formState.itemType}
        language={formState.language}
        title={formState.title}
        url={formState.url}
        onChange={(value) => onFieldChange('description', value)}
      />
    </div>
  </>
);

interface CreateItemDynamicFieldsProps {
  fieldErrors: CreateItemFormErrors;
  fileError: string | null;
  formState: CreateItemFormState;
  isSubmitting: boolean;
  onFieldChange: <T extends CreateItemFormField>(
    field: T,
    value: CreateItemFormState[T],
  ) => void;
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  uploadProgress: number;
}

const CreateItemDynamicFields = ({
  fieldErrors,
  fileError,
  formState,
  isSubmitting,
  onFieldChange,
  onFileChange,
  selectedFile,
  uploadProgress,
}: CreateItemDynamicFieldsProps) => {
  const { hasContent, hasFile, hasLanguage, hasUrl } =
    getItemFormCapabilities(formState.itemType);
  const usesCodeEditor = isCodeEditorItemType(formState.itemType);
  const usesMarkdownEditor = isMarkdownEditorItemType(formState.itemType);
  const languageOptions = getCodeEditorLanguageOptions(formState.language);

  return (
    <>
      {hasFile ? (
        <div className='space-y-3 sm:col-span-2'>
          <FileUpload
            itemType={formState.itemType as FileUploadItemType}
            file={selectedFile}
            error={fileError ?? undefined}
            isUploading={isSubmitting}
            progress={uploadProgress}
            onChange={onFileChange}
          />
        </div>
      ) : null}

      {usesCodeEditor && hasLanguage ? (
        <div className='space-y-3 sm:col-span-2'>
          <ItemLanguageDropdown
            id='create-item-language'
            value={formState.language}
            itemType={formState.itemType}
            options={languageOptions}
            errors={fieldErrors.language}
            onChange={(value) => onFieldChange('language', value)}
          />
        </div>
      ) : null}

      {hasContent ? (
        <div className='sm:col-span-2'>
          <ItemContentField
            id='create-item-content'
            itemType={formState.itemType}
            language={formState.language}
            isCodeEditor={usesCodeEditor}
            isMarkdownEditor={usesMarkdownEditor}
            value={formState.content}
            errors={fieldErrors.content}
            onChange={(value) => onFieldChange('content', value)}
          />
        </div>
      ) : null}

      {hasLanguage && !usesCodeEditor ? (
        <ItemTextInputField
            id='create-item-language'
          label='Language'
            value={formState.language}
          onChange={(value) => onFieldChange('language', value)}
            placeholder='TypeScript, Bash, SQL...'
          errors={fieldErrors.language}
        />
      ) : null}

      {hasUrl ? (
        <div className='space-y-3 sm:col-span-2'>
          <ItemTextInputField
            id='create-item-url'
            label='URL'
            type='url'
            value={formState.url}
            onChange={(value) => onFieldChange('url', value)}
            placeholder='https://example.com'
            errors={fieldErrors.url}
          />
        </div>
      ) : null}
    </>
  );
};

interface CreateItemFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
  saveDisabled: boolean;
}

const CreateItemFooter = ({
  isSubmitting,
  onCancel,
  saveDisabled,
}: CreateItemFooterProps) => (
  <div className='flex flex-col-reverse gap-3 border-t border-border/70 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end'>
    <Button
      type='button'
      variant='outline'
      onClick={onCancel}
      disabled={isSubmitting}
    >
      Cancel
    </Button>
    <Button type='submit' disabled={saveDisabled}>
      {isSubmitting ? 'Creating...' : 'Create item'}
    </Button>
  </div>
);

export const CreateItemDialog = ({
  collections,
  isPro,
  itemTypes,
  onOpenChange,
  open,
}: CreateItemDialogProps) => {
  const router = useRouter();
  const { invalidateSearchData } = useSearch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateItemFormErrors>({});
  const [formState, setFormState] =
    useState<CreateItemFormState>(INITIAL_FORM_STATE);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const typeOptions = useMemo(() => {
    const itemTypesBySlug = new Map(
      itemTypes.map((itemType) => [itemType.slug, itemType]),
    );

    return ITEM_FORM_TYPES.map((itemType) => {
      const itemTypeMeta = itemTypesBySlug.get(TYPE_SLUGS[itemType]);

      return {
        value: itemType,
        label: TYPE_LABELS[itemType],
        color: itemTypeMeta?.color,
        disabled: !isPro && (itemType === 'file' || itemType === 'image'),
        icon: itemTypeMeta?.icon ?? TYPE_ICON_FALLBACKS[itemType],
      };
    });
  }, [isPro, itemTypes]);

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleFieldChange = <T extends CreateItemFormField>(
    field: T,
    value: CreateItemFormState[T],
  ) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSubmitError(null);
    if (field === 'title') {
      setFileError(null);
    }
  };

  const handleTypeChange = (itemType: CreateItemType) => {
    if (!isPro && (itemType === 'file' || itemType === 'image')) {
      return;
    }

    setFormState((currentState) => ({
      ...resetItemFormValuesForType(currentState, itemType),
      itemType,
    }));
    setFieldErrors({});
    setSubmitError(null);
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requiresFileUpload = isFileItemType(formState.itemType);

    if (requiresFileUpload && !selectedFile) {
      setFileError('Select a file before creating this item.');
      toast.error('Select a file before creating this item.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});
    setFileError(null);

    let uploadedFile: UploadedFilePayload | null = null;

    if (
      requiresFileUpload &&
      selectedFile &&
      isFileUploadItemType(formState.itemType)
    ) {
      try {
        uploadedFile = await uploadSelectedFile(
          selectedFile,
          formState.itemType,
          setUploadProgress,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to upload file.';

        setIsSubmitting(false);
        setFileError(message);
        toast.error(message);
        return;
      }
    }

    const result = await createItem(
      buildCreateItemPayload({
        itemType: formState.itemType,
        title: formState.title,
        description: formState.description,
        tags: parseItemTagsInput(formState.tags),
        content: formState.content,
        language: formState.language,
        fileName: uploadedFile?.fileName,
        fileSize: uploadedFile?.fileSize,
        fileUrl: uploadedFile?.fileUrl,
        url: formState.url,
        collectionIds: formState.collectionIds,
      }),
    );

    setIsSubmitting(false);
    setUploadProgress(0);

    if (!result.success || !result.data) {
      if (uploadedFile?.fileUrl) {
        void cleanupUploadedFile(uploadedFile.fileUrl);
      }

      const actionError =
        typeof result.error === 'string'
          ? ({ message: result.error } satisfies CreateItemActionError)
          : result.error;

      setSubmitError(actionError?.message ?? 'Unable to create item.');
      setFieldErrors(actionError?.fieldErrors ?? {});
      toast.error(actionError?.message ?? 'Unable to create item.');
      return;
    }

    handleOpenChange(false);
    invalidateSearchData();
    toast.success('Item created.');
    startTransition(() => {
      router.refresh();
    });
  };

  const requiresUrl = isUrlItemType(formState.itemType);
  const requiresFileUpload = isFileItemType(formState.itemType);
  const saveDisabled =
    isSubmitting ||
    isRefreshPending ||
    !formState.title.trim() ||
    (requiresFileUpload && !selectedFile) ||
    (requiresUrl && !formState.url.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl'>
        <DialogHeader className='border-b border-border/70 px-6 py-5'>
          <DialogTitle>Create a new item</DialogTitle>
          <DialogDescription>
            Add a snippet, prompt, command, note, file, image, or link without
            leaving the page.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='flex max-h-[calc(90vh-5rem)] flex-col'
        >
          <div className='space-y-6 overflow-y-auto px-6 py-5'>
            <CreateItemTypePicker
              fieldErrors={fieldErrors}
              formState={formState}
              isPro={isPro}
              onTypeChange={handleTypeChange}
              typeOptions={typeOptions}
            />

            <div className='grid gap-5 sm:grid-cols-2'>
              <CreateItemMainFields
                fieldErrors={fieldErrors}
                formState={formState}
                isPro={isPro}
                onFieldChange={handleFieldChange}
                selectedFile={selectedFile}
              />

              <CreateItemDynamicFields
                fieldErrors={fieldErrors}
                fileError={fileError}
                formState={formState}
                isSubmitting={isSubmitting}
                onFieldChange={handleFieldChange}
                onFileChange={(file) => {
                  setSelectedFile(file);
                  setFileError(null);

                  if (!formState.title.trim() && file) {
                    const titleWithoutExtension = file.name.replace(
                      /\.[^.]+$/,
                      '',
                    );
                    handleFieldChange(
                      'title',
                      titleWithoutExtension || file.name,
                    );
                  }
                }}
                selectedFile={selectedFile}
                uploadProgress={uploadProgress}
              />

              <div className='sm:col-span-2'>
                <ItemTagsField
                  key={`${open}:${formState.itemType}`}
                  content={formState.content}
                  description={formState.description}
                  errors={fieldErrors.tags}
                  id='create-item-tags'
                  isPro={isPro}
                  itemType={formState.itemType}
                  language={formState.language}
                  tagsValue={formState.tags}
                  title={formState.title}
                  url={formState.url}
                  onChange={(value) => handleFieldChange('tags', value)}
                />
              </div>

              <CollectionPicker
                collections={collections}
                errors={fieldErrors.collectionIds}
                id='create-item-collections'
                onChange={(collectionIds) =>
                  handleFieldChange('collectionIds', collectionIds)
                }
                selectedCollectionIds={formState.collectionIds}
              />

              {submitError ? (
                <div className='sm:col-span-2'>
                  <p className='text-sm text-destructive'>{submitError}</p>
                </div>
              ) : null}
            </div>
          </div>

          <CreateItemFooter
            isSubmitting={isSubmitting}
            onCancel={() => handleOpenChange(false)}
            saveDisabled={saveDisabled}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
