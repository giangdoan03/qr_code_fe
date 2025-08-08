<template>
    <div>
        <a-space style="margin-bottom: 16px">
            <a-input v-model:value="search" placeholder="Tìm kiếm sự kiện..." @pressEnter="fetchEvents" />
            <a-button type="primary" @click="fetchEvents">Tìm kiếm</a-button>
            <a-button type="primary" @click="goToCreate">Tạo mới</a-button>
            <a-button
                type="primary"
                danger
                :disabled="!selectedRowKeys.length"
                @click="confirmDeleteSelected"
            >
                Xoá đã chọn ({{ selectedRowKeys.length }})
            </a-button>
        </a-space>

        <a-table
            :columns="columns"
            :data-source="events"
            :pagination="pagination"
            :loading="loading"
            row-key="id"
            @change="handleTableChange"
            :row-selection="rowSelection"
        >
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'banner'">
                    <a-image
                        :src="record.banner"
                        :width="100"
                        :height="80"
                        :preview="true"
                        alt="banner"
                        style="object-fit: cover"
                    />
                </template>

                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button type="link" @click="goToEdit(record.id)">Sửa</a-button>
                        <a-popconfirm title="Xác nhận xoá?" @confirm="deleteEvent(record.id)">
                            <a-button type="link" danger>Xoá</a-button>
                        </a-popconfirm>
                    </a-space>
                </template>
            </template>
        </a-table>
    </div>
</template>

<script setup>
import { ref, onMounted, computed} from 'vue'
import { useRouter } from 'vue-router'
import { getEvents, deleteEvent as apiDeleteEvent } from '../api/event'
import { message } from 'ant-design-vue'
import { formatDate } from '../utils/formUtils'

const router = useRouter()
const events = ref([])
const loading = ref(false)
const search = ref('')
const pagination = ref({ current: 1, pageSize: 10, total: 0 })

const selectedRowKeys = ref([])

const rowSelection = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys) => {
        selectedRowKeys.value = keys
    }
}))

const confirmDeleteSelected = async () => {
    if (!selectedRowKeys.value.length) return

    try {
        await Promise.all(selectedRowKeys.value.map(id => apiDeleteEvent(id)))
        message.success(`Đã xoá ${selectedRowKeys.value.length} sự kiện`)
        selectedRowKeys.value = []
        await fetchEvents()
    } catch (e) {
        message.error('Lỗi xoá hàng loạt')
    }
}


const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Banner', dataIndex: 'banner', key: 'banner' },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
    { title: 'Thời gian', dataIndex: 'start_time', key: 'start_time', customRender: ({ text }) => formatDate(text) },
    { title: 'Hành động', key: 'action' },
]

const fetchEvents = async () => {
    loading.value = true
    try {
        const response = await getEvents({
            page: pagination.value.current,
            per_page: pagination.value.pageSize,
            search: search.value
        })
        events.value = response.data.data
        pagination.value.total = response.data.pager.total
    } catch (e) {
        message.error('Lỗi tải dữ liệu sự kiện')
    } finally {
        loading.value = false
    }
}

const handleTableChange = (p) => {
    pagination.value.current = p.current
    pagination.value.pageSize = p.pageSize
    fetchEvents()
}

const goToCreate = () => router.push('/events/create')
const goToEdit = (id) => router.push(`/events/${id}/edit`)

const deleteEvent = async (id) => {
    try {
        await apiDeleteEvent(id)
        message.success('Đã xoá sự kiện')
        await fetchEvents()
    } catch (e) {
        message.error('Xoá thất bại')
    }
}

onMounted(fetchEvents)
</script>

<style scoped></style>
