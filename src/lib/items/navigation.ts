const PRO_ONLY_ITEM_ROUTE_SLUGS = new Set(["files", "images"]);

export const isProOnlyItemRoute = (slug: string) => PRO_ONLY_ITEM_ROUTE_SLUGS.has(slug);

export const getItemTypeHref = (slug: string) => `/items/${slug}`;
