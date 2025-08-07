<template>
    <a-form layout="vertical" v-if="form">
        <a-form-item label="Chọn doanh nghiệp">
            <a-select
                v-model:value="form.target_id"
                placeholder="Chọn doanh nghiệp"
                :options="businessOptions"
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
import { getBusinesses } from '@/api/business.js'

const form = defineModel()
const businessOptions = ref([])

defineExpose({
    requireTarget: true
})

const filterOption = (input, option) => {
    return option.label.toLowerCase().includes(input.toLowerCase())
}

const parseAvatar = (logo) => {
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

const fetchBusinesses = async () => {
    try {
        const res = await getBusinesses({ per_page: 1000 })

        console.log('res',res)
        businessOptions.value = (res.data?.data || []).map(b => ({
            label: b.name,
            value: Number(b.id),
            avatar: parseAvatar(b.logo),
            status: Number(b.status),
            disabled: Number(b.status) !== 1,
        }))
    } catch (err) {
        console.error('Lỗi tải doanh nghiệp:', err)
    }
}

onMounted(async () => {
    await fetchBusinesses();

    // Nếu form.target_id đã có, cố gắng tìm lại label đúng
    if (form?.target_id) {
        const matched = businessOptions.value.find(b => b.value === Number(form.target_id));
        if (!matched && typeof form.target_id === 'string') {
            form.target_id = Number(form.target_id); // ép kiểu nếu chưa đúng
        }
    }
});


watch(() => form?.target_id, (val) => {
    if (typeof val === 'string') {
        form.target_id = Number(val)
    }
})

onMounted(fetchBusinesses)
</script>
