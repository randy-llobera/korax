export const FREE_TIER_ITEM_LIMIT = 50;
export const FREE_TIER_COLLECTION_LIMIT = 3;

interface ProAccessInput {
  isPro: boolean;
}

interface ItemLimitInput extends ProAccessInput {
  itemCount: number;
}

interface CollectionLimitInput extends ProAccessInput {
  collectionCount: number;
}

export const canCreateItem = ({ isPro, itemCount }: ItemLimitInput) =>
  isPro || itemCount < FREE_TIER_ITEM_LIMIT;

export const canCreateCollection = ({
  isPro,
  collectionCount,
}: CollectionLimitInput) => isPro || collectionCount < FREE_TIER_COLLECTION_LIMIT;

export const canUseFileUploads = ({ isPro }: ProAccessInput) => isPro;

export const canUseImageUploads = ({ isPro }: ProAccessInput) => isPro;

export const canUseAiFeatures = ({ isPro }: ProAccessInput) => isPro;
