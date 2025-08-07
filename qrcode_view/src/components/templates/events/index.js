const assetBase = import.meta.env.VITE_ASSET_URL
export default [
    {
        id: 'tpl-1',
        title: 'Mẫu 1',
        description: 'Giao diện vàng nhẹ',
        thumbnail: `${assetBase}/files/images/event_image_demo_1.png`,
        component: () => import('./Tpl1.vue'),
    },
    {
        id: 'tpl-2',
        title: 'Mẫu 2',
        description: 'Giao diện tím sang trọng',
        thumbnail: `${assetBase}/files/images/event_image_demo_2.png`,
        component: () => import('./Tpl2.vue'),
    }
]
