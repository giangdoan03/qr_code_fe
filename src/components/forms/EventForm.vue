<template>
    <a-form layout="vertical" v-if="form">
        <a-form-item label="Chọn sự kiện">
            <a-select
                v-model:value="form.target_id"
                placeholder="Chọn sự kiện"
                show-search
                :filter-option="filterOption"
            >
                <a-select-option
                    v-for="event in eventOptions"
                    :key="event.value"
                    :value="event.value"
                >
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img :src="event.banner" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px;" />
                        <div>{{ event.label }}</div>
                    </div>
                </a-select-option>
            </a-select>

        </a-form-item>

        <a-form-item label="Nhập tên cho QR của bạn (tuỳ chọn)">
            <a-input v-model:value="form.qr_name" placeholder="Nhập tên cho QR..." />
        </a-form-item>
    </a-form>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { getEvents } from '@/api/event.js' // bạn cần chắc chắn file này tồn tại

const form = defineModel()

defineExpose({
    requireTarget: true
})

const eventOptions = ref([])

const filterOption = (input, option) => {
    return option.label.text.toLowerCase().includes(input.toLowerCase())
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

const parseAvatar = (banner) => {
    if (!banner) return null

    if (Array.isArray(banner)) return banner[0] || null

    if (typeof banner === 'string') {
        try {
            const parsed = JSON.parse(banner)
            if (Array.isArray(parsed)) return parsed[0] || null
            return banner
        } catch {
            return banner
        }
    }

    return null
}

const fetchEvents = async () => {
    try {
        const res = await getEvents({ per_page: 1000 })
        eventOptions.value = (res.data?.data || []).map(event => ({
            value: Number(event.id),
            label: event.name, // label chỉ là chuỗi
            banner: event.banner || getCoverImageFromImages(event.images),
        }))
    } catch (err) {
        console.error('Lỗi tải sự kiện:', err)
    }
}


watch(() => form?.target_id, (val) => {
    if (typeof val === 'string') {
        form.target_id = Number(val)
    }
})

onMounted(fetchEvents)
</script>

