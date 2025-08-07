const assetBase = import.meta.env.VITE_ASSET_URL?.replace(/\/+$/, '') || '';

export const getAssetUrl = (path = '') => {
    return `${assetBase}/${path.replace(/^\/+/, '')}`;
};
