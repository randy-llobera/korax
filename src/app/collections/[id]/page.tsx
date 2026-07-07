import { createElement } from 'react';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';

import {
  getAvailableCollections,
  getCollectionDetailById,
  getSidebarCollectionsData,
} from '@/lib/db/collections';
import { getDashboardUser } from '@/lib/db/dashboard-user';
import {
  getItemTypeLabel,
  getItemTypeSlug,
  getSidebarItemTypes,
} from '@/lib/db/items';
import { COLLECTIONS_PER_PAGE, parsePageParam } from '@/lib/pagination';

import { DashboardItemCard } from '@/components/dashboard/dashboard-item-card';
import { DashboardItemsList } from '@/components/dashboard/dashboard-items-list';
import { CollectionActions } from '@/components/dashboard/collection-actions';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PaginationControls } from '@/components/dashboard/pagination-controls';
import { AppPageShell } from '@/components/layout/app-page-shell';
import { formatUpdatedAt } from '@/components/utils/date';
import { getItemTypeIcon } from '@/components/utils/item-type';

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    page?: string | string[];
  }>;
}

const CollectionDetailPage = async ({
  params,
  searchParams,
}: CollectionDetailPageProps) => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams?.page);
  const [user, itemTypes, sidebarCollections, collections, collection] =
    await Promise.all([
      getDashboardUser(),
      getSidebarItemTypes(),
      getSidebarCollectionsData(),
      getAvailableCollections(),
      getCollectionDetailById(id, page, COLLECTIONS_PER_PAGE),
    ]);

  if (!collection) {
    notFound();
  }

  const filesGroup = collection.itemTypes.find(
    (itemType) => getItemTypeSlug(itemType.name) === 'files',
  );
  const imagesGroup = collection.itemTypes.find(
    (itemType) => getItemTypeSlug(itemType.name) === 'images',
  );

  const mixedItems = collection.items.filter((item) => {
    const slug = getItemTypeSlug(item.itemType.name);

    return slug !== 'files' && slug !== 'images';
  });
  const fileItems = collection.items.filter(
    (item) => getItemTypeSlug(item.itemType.name) === 'files',
  );
  const imageItems = collection.items.filter(
    (item) => getItemTypeSlug(item.itemType.name) === 'images',
  );

  return (
    <DashboardShell
      user={user}
      collections={collections}
      itemTypes={itemTypes}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
    >
      <AppPageShell className='gap-8'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='min-w-0 flex-1 space-y-3'>
            <div className='flex flex-wrap items-baseline gap-3'>
              <h1 className='text-[2rem] font-semibold leading-none tracking-tight'>
                {collection.name}
              </h1>
              <span className='text-lg font-medium text-muted-foreground'>
                ({collection.itemCount}{' '}
                {collection.itemCount === 1 ? 'item' : 'items'})
              </span>
              {collection.isFavorite ? (
                <Star className='size-4 fill-current text-yellow-400' />
              ) : null}
            </div>

            <p className='text-base text-muted-foreground'>
              {collection.description}
            </p>

            <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground'>
              {collection.itemTypes.map((itemType) => {
                const Icon = getItemTypeIcon(itemType.icon);

                return (
                  <span
                    key={itemType.id}
                    className='inline-flex items-center gap-1.5'
                  >
                    {createElement(Icon, {
                      className: 'size-3.5 shrink-0',
                      style: itemType.color
                        ? { color: itemType.color }
                        : undefined,
                    })}
                    <span>{itemType.itemCount}</span>
                  </span>
                );
              })}
            </div>

            <p className='text-sm text-muted-foreground'>
              Updated {formatUpdatedAt(collection.updatedAt)}
            </p>
          </div>
          <div className='shrink-0 whitespace-nowrap [&>div]:flex-nowrap'>
            <CollectionActions collection={collection} variant='detail' />
          </div>
        </div>

        {collection.items.length > 0 ? (
          <div className='space-y-8'>
            {mixedItems.length > 0 ? (
              <section>
                <div className='grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3'>
                  {mixedItems.map((item) => (
                    <DashboardItemCard
                      key={item.id}
                      item={item}
                      variant='items'
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {filesGroup && fileItems.length > 0 ? (
              <section className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <h2 className='text-lg font-semibold tracking-tight'>
                    {getItemTypeLabel(filesGroup.name)}
                  </h2>
                  <span className='text-sm text-muted-foreground'>
                    {fileItems.length}{' '}
                    {fileItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <DashboardItemsList
                  itemType={{
                    id: filesGroup.id,
                    name: filesGroup.name,
                    slug: getItemTypeSlug(filesGroup.name),
                    icon: filesGroup.icon,
                    color: filesGroup.color,
                  }}
                  items={fileItems}
                />
              </section>
            ) : null}

            {imagesGroup && imageItems.length > 0 ? (
              <section className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <h2 className='text-lg font-semibold tracking-tight'>
                    {getItemTypeLabel(imagesGroup.name)}
                  </h2>
                  <span className='text-sm text-muted-foreground'>
                    {imageItems.length}{' '}
                    {imageItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <DashboardItemsList
                  itemType={{
                    id: imagesGroup.id,
                    name: imagesGroup.name,
                    slug: getItemTypeSlug(imagesGroup.name),
                    icon: imagesGroup.icon,
                    color: imagesGroup.color,
                  }}
                  items={imageItems}
                />
              </section>
            ) : null}

            <PaginationControls
              basePath={`/collections/${id}`}
              pagination={collection.pagination}
            />
          </div>
        ) : (
          <div className='rounded-[1.75rem] border border-dashed border-border/70 bg-card/35 px-6 py-14 text-center'>
            <p className='text-base font-semibold'>
              No items in this collection yet
            </p>
            <p className='mt-2 text-sm text-muted-foreground'>
              Add items to this collection to see them here.
            </p>
          </div>
        )}
      </AppPageShell>
    </DashboardShell>
  );
};

export default CollectionDetailPage;
