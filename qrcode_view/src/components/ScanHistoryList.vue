<template>
    <div>
        <a-space style="margin-bottom: 16px;">
            <a-input v-model:value="search" placeholder="Tìm theo loại, tỉnh..." @pressEnter="fetchData"/>
            <a-button type="primary" @click="fetchData">Tìm kiếm</a-button>
            <a-button danger @click="deleteSelected" :disabled="!selectedRowKeys.length">
                Xoá đã chọn ({{ selectedRowKeys.length }})
            </a-button>
        </a-space>

        <a-table
                :columns="columns"
                :data-source="histories"
                :pagination="pagination"
                row-key="id"
                :loading="loading"
                @change="handleTableChange"
                :row-selection="rowSelection"
        >
            <!-- ✅ Template slot bodyCell đúng vị trí -->
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'stt'">
                    {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
                </template>

                <template v-else-if="column.key === 'object_image'">
                    <a-image
                        :src="record.object_image || 'https://placehold.co/100x100'"
                        :width="100"
                        :height="80"
                        :preview="true"
                        :fallback="'https://placehold.co/100x100'"
                        alt="Ảnh"
                        style="object-fit: cover"
                    />
                </template>

                <template v-else-if="column.key === 'type'">
                    <a-tag :color="getTypeColor(record.type)">
                        {{ getTypeLabel(record.type) }}
                    </a-tag>
                </template>

                <template v-else-if="column.key === 'qr_name' || column.key === 'object_name'">
                    <a-tooltip :title="record[column.key]">
                        <span class="truncate block max-w-[150px]">{{ record[column.key] }}</span>
                    </a-tooltip>
                </template>

                <template v-else-if="column.key === 'os'">
                    <a-tag>{{ record.os }}</a-tag>
                </template>

                <template v-else-if="column.key === 'app'">
                    <a-tag color="blue">{{ record.app || 'Không xác định' }}</a-tag>
                </template>

                <template v-else-if="column.key === 'created_at'">
                    {{ formatDateTime(record.created_at) }}
                </template>
            </template>
        </a-table>

    </div>
</template>

<script setup>
    import {ref, onMounted, computed} from 'vue'
    import {message} from 'ant-design-vue'
    import {formatDate} from '../utils/formUtils'
    import axios from 'axios'
    import {formatDateTime} from '../utils/formUtils'
    import {getScanHistories, deleteScanHistory} from '../api/scanHistory'

    const histories = ref([])
    const loading = ref(false)
    const search = ref('')
    const pagination = ref({current: 1, pageSize: 10, total: 0})

    const columns = [
        { title: 'STT', key: 'stt', width: 60, align: 'center' },
        {title: 'Ảnh đối tượng', key: 'object_image', dataIndex: 'object_image'},
        {title: 'Tên QR Code', key: 'qr_name', dataIndex: 'qr_name', ellipsis: true},
        {title: 'Tên đối tượng', key: 'object_name', dataIndex: 'object_name', ellipsis: true},
        {title: 'Loại đối tượng', key: 'type', dataIndex: 'type'},
        {title: 'Tỉnh thành', key: 'city', dataIndex: 'city'},
        {title: 'Vị trí', key: 'location', dataIndex: 'location'},
        // { title: 'SĐT', key: 'phone', dataIndex: 'phone' },
        {title: 'IP', key: 'ip', dataIndex: 'ip'},
        {title: 'Hệ điều hành', key: 'os', dataIndex: 'os'},
        {title: 'Ứng dụng', key: 'app', dataIndex: 'app'},
        {title: 'Thời gian', key: 'created_at', dataIndex: 'created_at'}
    ]

    const selectedRowKeys = ref([])

    const rowSelection = computed(() => ({
        selectedRowKeys: selectedRowKeys.value,
        onChange: (keys) => {
            selectedRowKeys.value = keys
        }
    }))

    const getTypeColor = (type) => {
        const map = {
            product: 'blue',
            store: 'purple',
            event: 'green',
            person: 'volcano',
            business: 'gold',
        }
        return map[type] || 'default'
    }

    const getTypeLabel = (type) => {
        const map = {
            product: 'Sản phẩm',
            store: 'Cửa hàng',
            event: 'Sự kiện',
            person: 'Cá nhân',
            business: 'Doanh nghiệp',
        }
        return map[type] || type
    }


    const deleteSelected = async () => {
        if (!selectedRowKeys.value.length) return

        const confirm = window.confirm(`Xoá ${selectedRowKeys.value.length} bản ghi?`)
        if (!confirm) return

        loading.value = true
        try {
            await Promise.all(
                selectedRowKeys.value.map(id => deleteScanHistory(id))
            )
            message.success(`Đã xoá ${selectedRowKeys.value.length} bản ghi`)
            selectedRowKeys.value = []
            fetchData()
        } catch (err) {
            message.error('Xoá thất bại')
        } finally {
            loading.value = false
        }
    }


    const fetchData = async () => {
        loading.value = true
        try {
            const response = await getScanHistories({
                search: search.value,
                page: pagination.value.current,
                per_page: pagination.value.pageSize
            })

            histories.value = response.data.data.map((item) => {
                return {
                    ...item,
                    object_name: item.object_name || '',
                    object_image: item.object_image || '',
                    qr_name: item.qr_name || '',
                    qr_type: item.qr_type || '',
                    phone: item.phone_number || '',
                    ip: item.ip_address || '',
                    app: item.app || item.browser || 'Không xác định',
                    customer: item.user_id ? `User #${item.user_id}` : '',
                    location: item.city || ''
                }
            })

            pagination.value.total = response.data.pager.total
        } catch (err) {
            message.error('Không thể tải dữ liệu')
        } finally {
            loading.value = false
        }
    }


    const handleTableChange = (p) => {
        pagination.value.current = p.current
        pagination.value.pageSize = p.pageSize
        fetchData()
    }

    onMounted(fetchData)
</script>
