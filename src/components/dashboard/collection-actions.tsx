"use client";

import { useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Ellipsis,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
  type UpdateCollectionActionError,
} from "@/actions/collections";
import { useSearch } from "@/components/dashboard/search-provider";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CollectionActionsProps {
  collection: {
    id: string;
    name: string;
    description: string;
    isFavorite: boolean;
  };
  variant: "detail" | "menu";
}

interface CollectionFormState {
  description: string;
  name: string;
}

type CollectionFormField = keyof CollectionFormState;
type CollectionFormErrors = Partial<Record<CollectionFormField, string[]>>;

const FieldErrorText = ({ errors }: { errors?: string[] }) => {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-destructive">{errors[0]}</p>;
};

export const CollectionActions = ({
  collection,
  variant,
}: CollectionActionsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { invalidateSearchData } = useSearch();
  const [isRefreshPending, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavoritePending, setIsFavoritePending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CollectionFormErrors>({});
  const [pendingFavoriteValue, setPendingFavoriteValue] = useState<boolean | null>(null);
  const [formState, setFormState] = useState<CollectionFormState>({
    name: collection.name,
    description: collection.description === "No description yet." ? "" : collection.description,
  });
  const isFavorite = pendingFavoriteValue ?? collection.isFavorite;

  const resetForm = () => {
    setFormState({
      name: collection.name,
      description: collection.description === "No description yet." ? "" : collection.description,
    });
    setFieldErrors({});
    setSubmitError(null);
    setIsSaving(false);
  };

  const handleEditOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);

    if (!open) {
      resetForm();
    }
  };

  const handleFieldChange = (field: CollectionFormField, value: string) => {
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

  const refreshView = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setSubmitError(null);
    setFieldErrors({});

    const result = await updateCollection(collection.id, {
      name: formState.name,
      description: formState.description,
    });

    setIsSaving(false);

    if (!result.success) {
      const actionError =
        typeof result.error === "string"
          ? ({ message: result.error } satisfies UpdateCollectionActionError)
          : result.error;

      setSubmitError(actionError?.message ?? "Unable to update collection.");
      setFieldErrors(actionError?.fieldErrors ?? {});
      toast.error(actionError?.message ?? "Unable to update collection.");
      return;
    }

    handleEditOpenChange(false);
    invalidateSearchData();
    toast.success("Collection updated.");
    refreshView();
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteCollection(collection.id);

    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Unable to delete collection.");
      return;
    }

    setIsDeleteDialogOpen(false);
    invalidateSearchData();
    toast.success("Collection deleted.");

    if (pathname === `/collections/${collection.id}`) {
      router.replace("/collections");
      return;
    }

    refreshView();
  };

  const handleFavoriteToggle = async () => {
    const nextIsFavorite = !isFavorite;

    setIsFavoritePending(true);
    setPendingFavoriteValue(nextIsFavorite);

    const result = await toggleCollectionFavorite(collection.id, nextIsFavorite);

    setIsFavoritePending(false);

    if (!result.success || !result.data) {
      setPendingFavoriteValue(null);
      toast.error(result.error ?? "Unable to update collection.");
      return;
    }

    setPendingFavoriteValue(result.data.isFavorite);
    invalidateSearchData();
    toast.success(
      result.data.isFavorite
        ? `"${collection.name}" added to favorites.`
        : `"${collection.name}" removed from favorites.`,
    );
    refreshView();
  };

  const disabled = isSaving || isDeleting || isRefreshPending || isFavoritePending;
  const saveDisabled = disabled || !formState.name.trim();

  return (
    <>
      {variant === "menu" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="relative z-20 rounded-full text-muted-foreground hover:text-foreground"
              aria-label={`Open actions for ${collection.name}`}
            >
              <Ellipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleEditOpenChange(true)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleFavoriteToggle()} disabled={disabled}>
              <Star
                className={cn(
                  "size-4",
                  isFavorite ? "fill-current text-yellow-400" : "",
                )}
              />
              {isFavorite ? "Unfavorite" : "Favorite"}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex flex-nowrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => handleEditOpenChange(true)}
            disabled={disabled}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              void handleFavoriteToggle();
            }}
            disabled={disabled}
          >
            <Star
              className={cn(
                "size-4",
                isFavorite ? "fill-current text-yellow-400" : "",
              )}
            />
            {isFavorite ? "Unfavorite" : "Favorite"}
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                disabled={disabled}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes {collection.name} and keeps all items in your library.
                  They will just no longer belong to this collection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button" disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      void handleDelete();
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete collection"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {variant === "menu" ? (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes {collection.name} and keeps all items in your library.
                They will just no longer belong to this collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    void handleDelete();
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete collection"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Edit collection</DialogTitle>
            <DialogDescription>
              Update the collection name and description.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave}>
            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="edit-collection-name">
                  Name
                </label>
                <Input
                  id="edit-collection-name"
                  value={formState.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  placeholder="Frontend patterns"
                  aria-invalid={fieldErrors.name ? "true" : "false"}
                />
                <FieldErrorText errors={fieldErrors.name} />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="edit-collection-description"
                >
                  Description
                </label>
                <Textarea
                  id="edit-collection-description"
                  value={formState.description}
                  onChange={(event) =>
                    handleFieldChange("description", event.target.value)
                  }
                  placeholder="Add context for what belongs in this collection"
                  className="min-h-28"
                />
                <FieldErrorText errors={fieldErrors.description} />
              </div>

              {submitError ? (
                <p className="text-sm text-destructive">{submitError}</p>
              ) : null}
            </div>

            <DialogFooter className="px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveDisabled}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
