<template>
    <a-form layout="vertical" v-if="form">
        <a-form-item label="Chọn sản phẩm">
            <a-select
                v-model:value="form.target_id"
                placeholder="Chọn sản phẩm"
                :options="productOptions"
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
import { getProducts } from '@/api/product.js'

// Model nhận từ component cha
const form = defineModel()

defineExpose({
    requireTarget: true
})

// Danh sách sản phẩm
const productOptions = ref([])

const filterOption = (input, option) => {
    return option.label.toLowerCase().includes(input.toLowerCase())
}


const getCoverImageFromImages = (images) => {
    let list = []

    if (Array.isArray(images)) {
        list = images
    } else if (typeof images === 'string') {
        try {
            const parsed = JSON.parse(images)
            if (Array.isArray(parsed)) list = parsed
        } catch {
            return null
        }
    }

    const cover = list.find(img => img?.isCover === true)
    return cover?.url || (list[0]?.url || (typeof list[0] === 'string' ? list[0] : null)) || null
}


// Tải sản phẩm từ API
const parseAvatar = (avatar) => {
    if (!avatar) return null

    if (Array.isArray(avatar)) return avatar[0] || null

    if (typeof avatar === 'string') {
        try {
            const parsed = JSON.parse(avatar)
            if (Array.isArray(parsed)) return parsed[0] || null
            return avatar // fallback nếu là chuỗi ảnh đơn
        } catch {
            return avatar // fallback nếu parse lỗi
        }
    }

    return null
}

const fetchProducts = async () => {
    try {
        const res = await getProducts({ per_page: 1000 })
        productOptions.value = (res.data?.data || []).map(product => ({
            label: product.name,
            value: Number(product.id),
            avatar: getCoverImageFromImages(product.images),
            status: Number(product.status),
            disabled: Number(product.status) !== 1,
        }))

    } catch (err) {
        console.error('Lỗi tải sản phẩm:', err)
    }
}


// Đảm bảo target_id luôn là số
watch(() => form?.target_id, (val) => {
    if (typeof val === 'string') {
        form.target_id = Number(val)
    }
})

onMounted(fetchProducts)
</script>
