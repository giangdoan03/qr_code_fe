<template>
    <a-result
        status="500"
        title="Lỗi kết nối"
        :sub-title="message"
    >
        <template #extra>
            <a-button type="primary" @click="reloadPage">Thử lại</a-button>
        </template>
    </a-result>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// ✅ Bản đồ mã lỗi sang thông điệp
const errorMap = {
    ERR_NETWORK: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.',
    ERR_403: 'Bạn không có quyền truy cập.',
    ERR_500: 'Lỗi máy chủ nội bộ.',
}

const message = errorMap[route.query.code] || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'

function reloadPage() {
    window.location.reload()
}

let interval

onMounted(() => {
    interval = setInterval(async () => {
        try {
            const res = await axios.get('/api/check')

            // ✅ Miễn là server trả về 200 là OK → chuyển về dashboard
            if (res.status === 200) {
                await router.push('/dashboard') // hoặc path tuỳ bạn
            }
        } catch (err) {
            // vẫn đang lỗi, im lặng
        }
    }, 5000) // Kiểm tra mỗi 5 giây
})

onUnmounted(() => {
    clearInterval(interval)
})
</script>
