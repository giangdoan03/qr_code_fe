<template>
    <div>
        <!-- Header -->
        <a-page-header title="Danh sách các gói đã đăng ký" style="padding-top: 0;padding-left: 0">
            <template #extra>
                <a-button danger :disabled="!selectedRowKeys.length" @click="onBulkDelete">
                Xoá đã chọn ({{ selectedRowKeys.length }})
                </a-button>
            </template>
        </a-page-header>

        <a-spin :spinning="loading">
            <a-table
                :columns="columns"
                :data-source="packageData"
                rowKey="id"
                bordered
                :pagination="{ pageSize: 10 }"
                v-if="packageData.length > 0"
                :row-selection="rowSelection"
            />

            <a-empty v-else description="Chưa có gói nào được đăng ký" />
        </a-spin>
    </div>
</template>

<script setup>
import { ref, onMounted, h, resolveComponent, computed } from 'vue'
import {message, Modal} from 'ant-design-vue'
import { formatDate } from '../utils/formUtils'
import {deletePurchaseHistory, getPurchaseHistories} from '../api/purchaseHistory'
// ✅ trạng thái chọn
const selectedRowKeys = ref([])

const rowSelection = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    preserveSelectedRowKeys: true,        // giữ lựa chọn khi đổi trang
    onChange: (keys) => { selectedRowKeys.value = keys },
    // fixed: true, // nếu muốn cố định cột checkbox bên trái khi có scroll.x
}))

// ✅ xoá hàng loạt (hoặc 1 bản ghi nếu chỉ chọn 1)
const onBulkDelete = () => {
    if (!selectedRowKeys.value.length) return
    Modal.confirm({
        title: `Xoá ${selectedRowKeys.value.length} bản ghi đã chọn?`,
        content: 'Hành động này không thể hoàn tác.',
        okText: 'Xoá',
        okType: 'danger',
        cancelText: 'Huỷ',
        async onOk() {
            loading.value = true
            try {
                // Nếu có API xoá hàng loạt, dùng dòng dưới:
                // await deletePurchaseHistories({ ids: selectedRowKeys.value })

                // Không có API bulk: gọi tuần tự/parallel từng id
                const results = await Promise.allSettled(
                    selectedRowKeys.value.map((id) => deletePurchaseHistory(id))
                )
                const ok = results.filter(r => r.status === 'fulfilled').length
                const fail = results.length - ok
                if (ok)   message.success(`Đã xoá ${ok} bản ghi`)
                if (fail) message.warning(`${fail} bản ghi xoá thất bại`)

                selectedRowKeys.value = []
                await fetchPackages()
            } catch (e) {
                console.error(e)
                message.error('Không thể xoá bản ghi')
            } finally {
                loading.value = false
            }
        },
    })
}

const packageData = ref([])
const loading = ref(false)

const fetchPackages = async () => {
    try {
        loading.value = true
        const res = await getPurchaseHistories({ per_page: 100 })
        packageData.value = res.data.data || []
    } catch (e) {
        console.error(e)
        message.error('Không thể tải thông tin gói')
    } finally {
        loading.value = false
    }
}

onMounted(fetchPackages)

const columns = [
    { title: 'STT', key: 'stt', customRender: ({ index }) => index + 1 },
    { title: 'Người tạo', dataIndex: 'user_name', key: 'user_name' },
    { title: 'Email', dataIndex: 'user_email', key: 'user_email' },
    { title: 'Tên gói', dataIndex: 'product_name', key: 'product_name' },
    {
        title: 'Trạng thái',
        key: 'status',
        customRender: ({ record }) => {
            const ATag = resolveComponent('a-tag')
            const isExpired = new Date(record.expires_at) < new Date()
            const isInactive = record.is_active === 0

            return h(ATag, {
                color: isExpired || isInactive ? 'red' : 'green'
            }, () => isExpired || isInactive ? 'Đã ngừng hoạt động' : 'Đang hoạt động')
        }
    },

    {
        title: 'Thanh toán',
        key: 'is_paid',
        customRender: ({ record }) => {
            const ATag = resolveComponent('a-tag')
            return h(ATag, {
                color: record.is_paid ? 'blue' : 'orange'
            }, () => record.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán')
        }
    },
    {
        title: 'Ngày bắt đầu',
        dataIndex: 'starts_at',
        key: 'starts_at',
        customRender: ({ text }) => formatDate(text)
    },
    {
        title: 'Ngày hết hạn',
        dataIndex: 'expires_at',
        key: 'expires_at',
        customRender: ({ text }) => formatDate(text)
    },
    {
        title: 'Ghi chú',
        dataIndex: 'note',
        key: 'note',
        customRender: ({ text }) => text || 'Không có'
    }
]
</script>
