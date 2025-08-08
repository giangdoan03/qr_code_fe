<template>
    <div>
        <a-space style="margin-bottom: 16px;">
            <a-input
                v-model:value="search"
                placeholder="Tìm kiếm sản phẩm..."
                allow-clear
                @pressEnter="handleSearch"
                @change="onSearchChange"
            />

            <a-button type="primary" @click="fetchProducts">Tìm kiếm</a-button>
            <a-button type="primary" @click="goToCreate">Thêm sản phẩm</a-button>
            <a-button type="primary" @click="openImportModal">Import sản phẩm</a-button>
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
            :data-source="products"
            :pagination="pagination"
            row-key="id"
            :loading="loading"
            @change="handleTableChange"
            :row-selection="rowSelection"
        >
            <template #bodyCell="{ column, record }">
                <!-- Cột ảnh đại diện -->
                <template v-if="column.key === 'avatar'">
                    <a-image
                        v-if="getAvatarUrl(record.images)"
                        :src="getAvatarUrl(record.images)"
                        :width="100"
                        :height="80"
                        :preview="true"
                        style="object-fit: cover; border-radius: 4px"
                    />
                </template>


                <!-- Cột trạng thái -->
                <template v-if="column.key === 'status'">
                    <a-switch
                            :checked="record.status == 1"
                            @change="checked => toggleStatus(record, checked)"
                            checked-children="Bật"
                            un-checked-children="Tắt" />
                </template>

                <!-- Cột hành động -->
                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button type="link" @click="goToEdit(record.id)">Sửa</a-button>
                        <a-popconfirm title="Xác nhận xoá?" @confirm="deleteProduct(record.id)">
                            <a-button type="link" danger>Xoá</a-button>
                        </a-popconfirm>
                    </a-space>
                </template>
            </template>

        </a-table>

        <a-modal
            v-model:open="importVisible"
            title="Import sản phẩm từ Excel"
            :confirm-loading="importing"
            ok-text="Import"
            cancel-text="Hủy"
            @ok="handleImport"
        >
            <!-- Bọc cả upload và nút tải file mẫu vào cùng một hàng -->
            <a-space class="mb-2">
                <a-upload
                    :beforeUpload="beforeUpload"
                    :file-list="importFileList"
                    @remove="handleRemove"
                    accept=".xlsx"
                >
                    <a-button>Chọn file Excel (.xlsx)</a-button>
                </a-upload>

                <a-button type="link" @click="downloadSample">
                    📥 Tải file mẫu Excel
                </a-button>
            </a-space>

            <div v-if="importFileList.length" class="mt-2">
                Đã chọn: {{ importFileList[0]?.name }}
            </div>
        </a-modal>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProducts, deleteProduct as apiDeleteProduct, updateProductStatus, importProducts } from '../api/product'
import { message } from 'ant-design-vue'
import { formatDate } from '../utils/formUtils'

const router = useRouter()
const route = useRoute()

const products = ref([])
const loading = ref(false)
const search = ref(route.query.search || '')

const currentPage = ref(parseInt(route.query.page) || 1)
const pageSize = ref(10)
const totalItems = ref(0)

const selectedRowKeys = ref([])

const rowSelection = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    onChange: (selectedKeys) => {
        selectedRowKeys.value = selectedKeys
    }
}))

const confirmDeleteSelected = async () => {
    try {
        if (!selectedRowKeys.value.length) return

        const confirmed = window.confirm(`Xác nhận xoá ${selectedRowKeys.value.length} sản phẩm?`)
        if (!confirmed) return

        await Promise.all(selectedRowKeys.value.map(id => apiDeleteProduct(id)))
        message.success(`Đã xoá ${selectedRowKeys.value.length} sản phẩm`)
        selectedRowKeys.value = []
        await fetchProducts()
    } catch (error) {
        message.error('Lỗi xoá hàng loạt')
    }
}

const pagination = computed(() => ({
    current: currentPage.value,
    pageSize: pageSize.value,
    total: totalItems.value,
}))

const fetchProducts = async () => {
    loading.value = true
    try {
        const response = await getProducts({
            page: currentPage.value,
            per_page: pageSize.value,
            search: search.value,
        })

        const result = response.data?.data || []
        products.value = result.filter(p => p && p.name)
        totalItems.value = response.data?.pager?.total || 0
    } catch (error) {
        message.error('Lỗi tải sản phẩm')
        console.error('Fetch Error:', error)
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    currentPage.value = 1
    const query = { page: 1 }
    if (search.value.trim()) {
        query.search = search.value.trim()
    }

    router.replace({
        path: '/products',
        query
    })

    fetchProducts()
}

const handleTableChange = (paginationParam) => {
    currentPage.value = paginationParam.current
    pageSize.value = paginationParam.pageSize

    router.replace({
        path: '/products',
        query: {
            page: currentPage.value,
            search: search.value || ''
        }
    })

    fetchProducts()
}

const goToCreate = () => {
    router.push({
        path: '/products/create',
        query: { page: currentPage.value }
    })
}

const goToEdit = (id) => {
    router.push({
        path: `/products/${id}/edit`,
        query: { page: currentPage.value }
    })
}

const deleteProduct = async (id) => {
    try {
        await apiDeleteProduct(id)
        message.success('Đã xoá sản phẩm')
        await fetchProducts()
    } catch (error) {
        message.error('Lỗi xoá sản phẩm')
    }
}

const onSearchChange = () => {
    if (!search.value.trim()) {
        handleSearch()
    }
}

const getAvatarUrl = (images) => {
    if (!images) return null

    let list = []

    if (Array.isArray(images)) {
        list = images
    } else if (typeof images === 'string') {
        try {
            const parsed = JSON.parse(images)
            if (Array.isArray(parsed)) {
                list = parsed
            }
        } catch {
            return null
        }
    }

    const coverImage = list.find(img => img?.isCover === true)
    if (coverImage?.url) return coverImage.url

    if (list.length > 0) {
        return list[0]?.url || (typeof list[0] === 'string' ? list[0] : null)
    }

    return null
}

const toggleStatus = async (record, checked) => {
    try {
        await updateProductStatus(record.id, { status: checked ? 1 : 0 })
        record.status = checked ? 1 : 0
        message.success(`Đã ${checked ? 'bật' : 'tắt'} sản phẩm`)
    } catch (e) {
        message.error('Không thể cập nhật trạng thái')
    }
}

const formatCurrency = (value) => {
    if (!value) return ''
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value)
}
const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Ảnh đại diện', dataIndex: 'avatar', key: 'avatar' },
    {
        title: 'Tên sản phẩm',
        dataIndex: 'name',
        key: 'name',
        width: 300,
        customRender: ({ text }) => text || 'Không có tên'
    },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    {
        title: 'Giá',
        dataIndex: 'price',
        key: 'price',
        customRender: ({ text }) => text ? formatCurrency(text) : '0 VND'
    },
    {
        title: 'Ngày tạo',
        dataIndex: 'created_at',
        key: 'created_at',
        customRender: ({ text }) => text ? formatDate(text) : 'N/A'
    },
    {
        title: 'Ngày cập nhật',
        dataIndex: 'updated_at',
        key: 'updated_at',
        customRender: ({ text }) => text ? formatDate(text) : 'N/A'
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Hành động', key: 'action' }
]

// IMPORT
const importVisible = ref(false)
const importing = ref(false)
const importFileList = ref([])

const openImportModal = () => {
    importVisible.value = true
}

const beforeUpload = (file) => {
    importFileList.value = [file]
    return false
}

const handleRemove = () => {
    importFileList.value = []
}

const handleImport = async () => {
    if (!importFileList.value.length) {
        return message.warning('Vui lòng chọn file Excel')
    }

    const formData = new FormData()
    formData.append('file', importFileList.value[0])

    importing.value = true
    try {
        await importProducts(formData)
        message.success('Import thành công 🎉')
        importVisible.value = false
        importFileList.value = []
        await fetchProducts()
    } catch (e) {
        console.error(e)
        message.error(e?.response?.data?.messages?.error || 'Lỗi import')
    } finally {
        importing.value = false
    }
}

const downloadSample = () => {
    window.open('https://assets.labit365.com/image/import_sample.xlsx', '_blank')
}

// INIT
onMounted(() => {
    fetchProducts()
})
</script>

