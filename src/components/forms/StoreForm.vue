<template>
    <a-form layout="vertical" v-if="form">
        <a-form-item label="Chọn cửa hàng">
            <a-select
                v-model:value="form.target_id"
                placeholder="Chọn cửa hàng"
                :options="storeOptions"
                show-search
                :filter-option="filterOption"
            >
                <template #option="{ label, avatar, status, disabled }">
                    <div style="display: flex; align-items: center; gap: 8px;" :style="{ opacity: disabled ? 0.5 : 1 }">
                        <img :src="avatar" alt="avatar" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px;" />
                        <div style="flex: 1;">{{ label }}</div>
                        <a-tag :color="status === 1 ? 'green' : 'red'">{{ status === 1 ? 'Đang kích hoạt' : 'Chưa kích hoạt' }}</a-tag>
                    </div>
                </template>
            </a-select>
        </a-form-item>

        <a-form-item label="Nhập tên cho QR của bạn (tuỳ chọn)">
            <a-input v-model:value="form.qr_name" placeholder="Nhập tên cho QR..." />
        </a-form-item>
    </a-form>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getStores } from '@/api/store.js'

// Nhận props từ cha
const form = defineModel()

defineExpose({
    requireTarget: true
})

// Danh sách cửa hàng
const storeOptions = ref([])

const filterOption = (input, option) => {
    return option.label.toLowerCase().includes(input.toLowerCase())
}

// Parse ảnh logo từ store.logo
const parseLogo = (logo) => {
    if (!logo) return null

    if (Array.isArray(logo)) return logo[0] || null

    if (typeof logo === 'string') {
        try {
            const parsed = JSON.parse(logo)
            if (Array.isArray(parsed)) return parsed[0] || null
            return logo
        } catch {
            return logo
        }
    }

    return null
}

// Tải danh sách cửa hàng
const fetchStores = async () => {
    try {
        const res = await getStores({ per_page: 1000 })
        storeOptions.value = (res.data?.data || []).map(store => ({
            label: store.name,
            value: Number(store.id),
            avatar: parseLogo(store.logo),
            status: Number(store.status),
            disabled: Number(store.status) !== 1,
        }))
    } catch (err) {
        console.error('Lỗi tải cửa hàng:', err)
    }
}

// Đồng bộ kiểu dữ liệu target_id là số
watch(() => form?.target_id, (val) => {
    if (typeof val === 'string') {
        form.target_id = Number(val)
    }
})

onMounted(fetchStores)
</script>
