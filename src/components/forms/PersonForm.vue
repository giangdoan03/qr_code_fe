<template>
    <a-form layout="vertical" v-if="form">
        <a-form-item label="Chọn người dùng">
            <a-select
                v-model:value="form.target_id"
                placeholder="Chọn người dùng"
                :options="personOptions"
                show-search
                :filter-option="filterOption"
            >
                <template #option="option">
                    <div
                        style="display: flex; align-items: center; gap: 8px;"
                        :style="{ opacity: option.disabled ? 0.5 : 1 }"
                    >
                        <img
                            :src="option.avatar"
                            alt="avatar"
                            style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px;"
                        />
                        <div style="flex: 1;">{{ option.label }}</div>
                        <a-tag :color="option.status === 1 ? 'green' : 'red'">
                            {{ option.status === 1 ? 'Đang kích hoạt' : 'Chưa kích hoạt' }}
                        </a-tag>
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
import { getPersons } from '@/api/person.js'

// Nhận form từ component cha
const form = defineModel()

defineExpose({
    requireTarget: true
})

// Danh sách người dùng hiển thị trong select
const personOptions = ref([])

// Hàm lọc khi tìm kiếm trong select
const filterOption = (input, option) => {
    return (option?.label || '').toLowerCase().includes(input.toLowerCase())
}

// Tải danh sách người dùng từ API
const fetchPersons = async () => {
    try {
        const res = await getPersons({ per_page: 1000 })
        const raw = res.data || []

        personOptions.value = raw.map(person => ({
            label: person.name,
            value: Number(person.id),
            avatar: person.avatar,
            status: 1, // giả định luôn active
            disabled: false
        }))
    } catch (err) {
        console.error('❌ Lỗi khi tải người dùng:', err)
    }
}


// Bảo đảm target_id là số (nếu nhập từ tay hoặc autofill)
watch(
    () => form?.target_id,
    (val) => {
        if (typeof val === 'string') {
            form.target_id = Number(val)
        }
    }
)

onMounted(fetchPersons)
</script>
