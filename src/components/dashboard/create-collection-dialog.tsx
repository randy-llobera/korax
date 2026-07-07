'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  createCollection,
  type CreateCollectionActionError,
} from '@/actions/collections';
import { useSearch } from '@/components/dashboard/search-provider';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreateCollectionDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface CreateCollectionFormState {
  description: string;
  name: string;
}

type CreateCollectionFormField = keyof CreateCollectionFormState;
type CreateCollectionFormErrors = Partial<Record<CreateCollectionFormField, string[]>>;

const INITIAL_FORM_STATE: CreateCollectionFormState = {
  name: '',
  description: '',
};

const FieldErrorText = ({ errors }: { errors?: string[] }) => {
  if (!errors?.length) {
    return null;
  }

  return <p className='text-sm text-destructive'>{errors[0]}</p>;
};

export const CreateCollectionDialog = ({
  onOpenChange,
  open,
}: CreateCollectionDialogProps) => {
  const router = useRouter();
  const { invalidateSearchData } = useSearch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateCollectionFormErrors>({});
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleFieldChange = (field: CreateCollectionFormField, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    const result = await createCollection({
      name: formState.name,
      description: formState.description,
    });

    setIsSubmitting(false);

    if (!result.success || !result.data) {
      const actionError =
        typeof result.error === 'string'
          ? ({ message: result.error } satisfies CreateCollectionActionError)
          : result.error;

      setSubmitError(actionError?.message ?? 'Unable to create collection.');
      setFieldErrors(actionError?.fieldErrors ?? {});
      toast.error(actionError?.message ?? 'Unable to create collection.');
      return;
    }

    handleOpenChange(false);
    invalidateSearchData();
    toast.success('Collection created.');
    startTransition(() => {
      router.refresh();
    });
  };

  const saveDisabled = isSubmitting || isRefreshPending || !formState.name.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-lg'>
        <DialogHeader className='border-b border-border/70 px-6 py-5'>
          <DialogTitle>Create a new collection</DialogTitle>
          <DialogDescription>
            Add a collection with a name and optional description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-5 px-6 py-5'>
            <div className='space-y-2'>
              <label className='text-sm font-medium' htmlFor='create-collection-name'>
                Name
              </label>
              <Input
                id='create-collection-name'
                value={formState.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                placeholder='Frontend patterns'
                aria-invalid={fieldErrors.name ? 'true' : 'false'}
              />
              <FieldErrorText errors={fieldErrors.name} />
            </div>

            <div className='space-y-2'>
              <label
                className='text-sm font-medium'
                htmlFor='create-collection-description'
              >
                Description
              </label>
              <Textarea
                id='create-collection-description'
                value={formState.description}
                onChange={(event) =>
                  handleFieldChange('description', event.target.value)
                }
                placeholder='Add context for what belongs in this collection'
                className='min-h-28'
              />
              <FieldErrorText errors={fieldErrors.description} />
            </div>

            {submitError ? (
              <p className='text-sm text-destructive'>{submitError}</p>
            ) : null}
          </div>

          <DialogFooter className='mx-0 mb-0 px-6 py-5'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={saveDisabled}>
              {isSubmitting ? 'Creating...' : 'Create collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
