'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, FolderOpen } from 'lucide-react';

import type { CollectionOption } from '@/lib/db/collections';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CollectionPickerProps {
  collections: CollectionOption[];
  errors?: string[];
  id: string;
  label?: string;
  onChange: (collectionIds: string[]) => void;
  selectedCollectionIds: string[];
}

const getTriggerLabel = (
  selectedNames: string[],
  totalCollections: number,
) => {
  if (selectedNames.length === 0) {
    return totalCollections > 0 ? 'Choose collections' : 'No collections available';
  }

  if (selectedNames.length === 1) {
    return selectedNames[0];
  }

  return `${selectedNames.length} collections selected`;
};

const dropdownTriggerClassName =
  'h-10 w-fit min-w-52 justify-between rounded-xl border-border/80 bg-[#121212] px-3 text-sm font-medium text-foreground shadow-none hover:bg-[#171717] disabled:opacity-60';

export const CollectionPicker = ({
  collections,
  errors,
  id,
  label = 'Collections',
  onChange,
  selectedCollectionIds,
}: CollectionPickerProps) => {
  const [open, setOpen] = useState(false);
  const selectedCollections = useMemo(
    () =>
      collections
        .filter((collection) => selectedCollectionIds.includes(collection.id)),
    [collections, selectedCollectionIds],
  );
  const selectedCollectionNames = selectedCollections.map(
    (collection) => collection.name,
  );

  const toggleCollection = (collectionId: string) => {
    if (selectedCollectionIds.includes(collectionId)) {
      onChange(selectedCollectionIds.filter((id) => id !== collectionId));
      return;
    }

    onChange([...selectedCollectionIds, collectionId]);
  };

  return (
    <div className='space-y-3 sm:col-span-2'>
      <label className='block text-sm font-medium' htmlFor={id}>
        {label}
      </label>
      <div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type='button'
              variant='outline'
              role='combobox'
              aria-expanded={open}
              aria-invalid={errors ? 'true' : 'false'}
              className={dropdownTriggerClassName}
              disabled={collections.length === 0}
            >
              <span className='flex min-w-0 items-center gap-2 truncate'>
                <FolderOpen className='size-4 shrink-0 text-muted-foreground' />
                <span className='truncate'>
                  {getTriggerLabel(selectedCollectionNames, collections.length)}
                </span>
              </span>
              <ChevronsUpDown className='size-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
            <Command>
              <CommandInput placeholder='Search collections...' />
              <CommandList>
                <CommandEmpty>No matching collections.</CommandEmpty>
                <CommandGroup>
                  {collections.map((collection) => {
                    const checked = selectedCollectionIds.includes(collection.id);

                    return (
                      <CommandItem
                        key={collection.id}
                        value={collection.name}
                        onSelect={() => toggleCollection(collection.id)}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleCollection(collection.id)}
                          aria-label={collection.name}
                          className='pointer-events-none'
                        />
                        <span className='flex-1 truncate'>{collection.name}</span>
                        <Check
                          className={cn(
                            'size-4 text-primary transition-opacity',
                            checked ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <p className='text-sm text-muted-foreground'>
        Select none, one, or multiple collections.
      </p>
      {selectedCollections.length > 0 ? (
        <div className='flex flex-wrap gap-1.5'>
          {selectedCollections.map((collection) => (
            <span
              key={collection.id}
              className='inline-flex max-w-full rounded-full border border-border/70 bg-background/35 px-2 py-0.5 text-[11px] font-medium text-foreground'
              title={collection.name}
            >
              <span className='truncate'>{collection.name}</span>
            </span>
          ))}
        </div>
      ) : null}
      {errors?.length ? <p className='text-sm text-destructive'>{errors[0]}</p> : null}
    </div>
  );
};
