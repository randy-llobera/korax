'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { CollectionOption, SidebarCollection } from '@/lib/db/collections';
import type { DashboardUser } from '@/lib/db/dashboard-user';
import type { SidebarItemType } from '@/lib/db/items';

import { cn } from '@/lib/utils';

import { CreateCollectionDialog } from '@/components/dashboard/create-collection-dialog';
import { CreateItemDialog } from '@/components/dashboard/create-item-dialog';
import { GlobalSearchDialog } from '@/components/dashboard/global-search-dialog';
import { ItemDrawerProvider } from '@/components/dashboard/item-drawer-provider';
import { SearchProvider } from '@/components/dashboard/search-provider';
import { TopBar } from '@/components/layout/top-bar';
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger';
import { Sidebar } from '@/components/layout/sidebar';
import { EditorPreferencesProvider } from '@/contexts/editor-preferences-context';

interface DashboardShellProps {
  user: DashboardUser | null;
  collections: CollectionOption[];
  itemTypes: SidebarItemType[];
  favoriteCollections: SidebarCollection[];
  recentCollections: SidebarCollection[];
  children: ReactNode;
}

export const DashboardShell = ({
  user,
  collections,
  itemTypes,
  favoriteCollections,
  recentCollections,
  children,
}: DashboardShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateCollectionDialogOpen, setIsCreateCollectionDialogOpen] = useState(false);
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const shouldOpenCreateCollection = searchParams.get('createCollection') === '1';
  const shouldOpenCreateItem = searchParams.get('createItem') === '1';

  const clearDialogParam = (param: 'createCollection' | 'createItem') => {
    if (!searchParams.has(param)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(param);
    const nextSearch = nextParams.toString();

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
      scroll: false,
    });
  };

  const handleCreateCollectionOpenChange = (open: boolean) => {
    setIsCreateCollectionDialogOpen(open);

    if (!open) {
      clearDialogParam('createCollection');
    }
  };

  const handleCreateItemOpenChange = (open: boolean) => {
    setIsCreateItemDialogOpen(open);

    if (!open) {
      clearDialogParam('createItem');
    }
  };

  return (
    <SearchProvider>
      <EditorPreferencesProvider
        initialPreferences={user?.editorPreferences}
      >
        <ItemDrawerProvider collections={collections} isPro={Boolean(user?.isPro)}>
          <main className='min-h-screen bg-background text-foreground'>
            <div className='grid min-h-screen grid-rows-[auto_1fr]'>
              <TopBar
                isPro={Boolean(user?.isPro)}
                onCreateCollection={() => setIsCreateCollectionDialogOpen(true)}
                onCreateItem={() => setIsCreateItemDialogOpen(true)}
                mobileSidebar={
                  <MobileSidebarTrigger
                    user={user}
                    itemTypes={itemTypes}
                    favoriteCollections={favoriteCollections}
                    recentCollections={recentCollections}
                  />
                }
              />
              <GlobalSearchDialog />

              <div
                className={cn(
                  'grid min-h-0',
                  isSidebarCollapsed
                    ? 'lg:grid-cols-[5rem_minmax(0,1fr)]'
                    : 'lg:grid-cols-[18rem_minmax(0,1fr)]',
                )}
              >
                <Sidebar
                  collapsed={isSidebarCollapsed}
                  user={user}
                  itemTypes={itemTypes}
                  favoriteCollections={favoriteCollections}
                  recentCollections={recentCollections}
                  className='hidden lg:flex'
                  onToggleCollapsed={() =>
                    setIsSidebarCollapsed((current) => !current)
                  }
                />

                <section className='min-h-0 flex-1 overflow-y-auto p-6 sm:p-8'>
                  {children}
                </section>
              </div>
            </div>
          </main>
          <CreateCollectionDialog
            onOpenChange={handleCreateCollectionOpenChange}
            open={isCreateCollectionDialogOpen || shouldOpenCreateCollection}
          />
          <CreateItemDialog
            collections={collections}
            itemTypes={itemTypes}
            isPro={Boolean(user?.isPro)}
            onOpenChange={handleCreateItemOpenChange}
            open={isCreateItemDialogOpen || shouldOpenCreateItem}
          />
        </ItemDrawerProvider>
      </EditorPreferencesProvider>
    </SearchProvider>
  );
};
