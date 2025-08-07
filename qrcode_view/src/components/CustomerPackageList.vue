<template>
    <div>
        <a-page-header :title="`Khách hàng: ${customer?.name || ''}`" @back="$router.back()" style="padding-left: 0" />

        <a-descriptions bordered :column="1" size="small" style="margin-top: 16px">
            <a-descriptions-item label="Email">{{ customer?.email }}</a-descriptions-item>
            <a-descriptions-item label="Số điện thoại">{{ customer?.phone }}</a-descriptions-item>
            <a-descriptions-item label="Địa chỉ">{{ customer?.address }}</a-descriptions-item>
            <a-descriptions-item label="Tỉnh / Thành">{{ customer?.city }}</a-descriptions-item>
        </a-descriptions>

        <div style="margin-top: 32px">
            <a-space style="margin-bottom: 16px">
                <a-button type="primary" @click="registerPackage(customer)">
                    <template #icon><ShoppingCartOutlined /></template>
                    Mua thêm gói
                </a-button>
                <a-button v-if="currentPackage" type="default" @click="editPackage(currentPackage)">Gia hạn gói</a-button>
            </a-space>

            <a-table
                    :columns="columns"
                    :data-source="customer?.packages || []"
                    :pagination="false"
                    row-key="id"
                    bordered
                    size="small"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'is_paid'">
                        <a-tag :color="record.is_paid === '1' ? 'green' : 'red'">
                            {{ record.is_paid === '1' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                        </a-tag>
                    </template>

                    <template v-else-if="column.key === 'is_active'">
                        <a-tag v-if="record.is_paid === '0'" color="default">Chưa kích hoạt</a-tag>
                        <a-tag v-else-if="isExpired(record.expires_at)" color="red">Đã hết hạn</a-tag>
                        <a-tag v-else color="blue">Đã kích hoạt</a-tag>
                    </template>

                    <template v-else-if="['purchased_at', 'starts_at', 'expires_at'].includes(column.key)">
                        <span>
                          {{ formatDate(record[column.key]) }}
                          <a-tag
                                  v-if="column.key === 'expires_at' && isExpired(record.expires_at)"
                                  color="red"
                                  style="margin-left: 8px;"
                          >
                            Hết hạn
                          </a-tag>
                        </span>
                    </template>

                    <template v-else>
                        {{ record[column.key] }}
                    </template>
                </template>
            </a-table>
        </div>

        <a-drawer :open="showDrawer" :title="isEditing ? 'Gia hạn gói hiện tại' : 'Đăng ký gói mới'" @close="showDrawer = false" width="500">
            <div style="margin-bottom: 12px">
                <strong>Khách hàng:</strong> {{ customer?.name }}
            </div>

            <div v-if="currentPackage" style="margin-bottom: 24px; padding: 12px; background: #f0f2f5; border-radius: 6px">
                <h4>🎯 Gói hiện tại đang dùng:</h4>
                <p><strong>{{ currentPackage.product_name }}</strong></p>
                <p>Bắt đầu: {{ formatDate(currentPackage.starts_at) }}</p>
                <p>Hết hạn: {{ formatDate(currentPackage.expires_at) }}</p>
                <p>Thanh toán: {{ currentPackage.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán' }}</p>
            </div>

            <a-form layout="vertical">
                <a-form-item label="Gói đăng ký">
                    <a-select v-model:value="form.product_name">
                        <a-select-option value="Gói Premium">Gói Premium</a-select-option>
                    </a-select>
                </a-form-item>

                <a-form-item label="Thời hạn gói (năm)">
                    <a-input-number v-model:value="form.years" :min="1" :max="5" />
                </a-form-item>

                <a-form-item>
                    <a-checkbox v-model:checked="form.is_active">Kích hoạt ngay</a-checkbox>
                </a-form-item>

                <a-form-item>
                    <a-checkbox v-model:checked="form.is_paid">Đã thanh toán</a-checkbox>
                </a-form-item>

                <a-button type="primary" block @click="isEditing ? handleExtend() : handleRegister()">
                    {{ isEditing ? 'Gia hạn gói' : 'Đăng ký gói mới' }}
                </a-button>
            </a-form>
        </a-drawer>
    </div>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue'
    import { useRoute } from 'vue-router'
    import { formatDate } from '@/utils/formUtils'
    import { getCustomer } from '@/api/customer'
    import { getPurchaseHistories, createPurchaseHistory, updatePurchaseHistory } from '@/api/purchaseHistory'
    import { message } from 'ant-design-vue'
    import { ShoppingCartOutlined } from '@ant-design/icons-vue'
    import dayjs from 'dayjs'

    const route = useRoute()
    const customer = ref(null)
    const showDrawer = ref(false)
    const isEditing = ref(false)
    const form = ref({
        years: 1,
        product_name: 'Gói Premium',
        is_active: true,
        is_paid: false
    })
    const packageHistory = ref([])

    const currentPackage = computed(() =>
        packageHistory.value.find(p => p.is_active == 1 && p.is_paid == 1 && dayjs(p.expires_at).isAfter(dayjs()))
    )

    const columns = [
        { title: 'Tên gói', key: 'product_name', dataIndex: 'product_name' },
        { title: 'Số lượng', key: 'quantity', dataIndex: 'quantity' },
        { title: 'Ngày mua', key: 'purchased_at', dataIndex: 'purchased_at' },
        { title: 'Bắt đầu', key: 'starts_at', dataIndex: 'starts_at' },
        { title: 'Kết thúc', key: 'expires_at', dataIndex: 'expires_at' },
        { title: 'Thanh toán', key: 'is_paid', dataIndex: 'is_paid' },
        { title: 'Trạng thái', key: 'is_active', dataIndex: 'is_active' }
    ]

    onMounted(async () => {
        try {
            const res = await getCustomer(route.params.id)
            customer.value = res.data
            packageHistory.value = res.data.packages || []
        } catch (e) {
            console.error('Không tìm thấy khách hàng', e)
        }
    })

    const registerPackage = async (cust) => {
        form.value = {
            years: 1,
            product_name: 'Gói Premium',
            is_active: true,
            is_paid: false
        }
        isEditing.value = false
        showDrawer.value = true

        try {
            const res = await getPurchaseHistories({ customer_id: cust.id })
            packageHistory.value = res.data.data || []
        } catch (e) {
            message.error('Không tải được lịch sử gói')
        }
    }

    const editPackage = (pkg) => {
        form.value = {
            years: 1,
            product_name: pkg.product_name,
            is_active: pkg.is_active == 1,
            is_paid: pkg.is_paid == 1
        }
        isEditing.value = true
        showDrawer.value = true
    }

    const handleRegister = async () => {
        if (currentPackage.value) {
            message.warning('Khách hàng đang có gói hoạt động. Không thể đăng ký mới.')
            return
        }

        try {
            const now = new Date()
            const years = form.value.years || 1

            const payload = {
                customer_id: customer.value.id,
                product_name: form.value.product_name,
                quantity: years,
                is_active: form.value.is_active ? 1 : 0,
                is_paid: form.value.is_paid ? 1 : 0,
                starts_at: now.toISOString(),
                expires_at: new Date(now.setFullYear(now.getFullYear() + years)).toISOString()
            }

            await createPurchaseHistory(payload)
            message.success('Đăng ký gói thành công')

            await registerPackage(customer.value)
            customer.value.packages = [...packageHistory.value]
            showDrawer.value = false
        } catch (e) {
            message.error('Lỗi khi đăng ký gói')
        }
    }

    const handleExtend = async () => {
        try {
            const years = form.value.years || 1

            const payload = {
                extend_years: years,
                is_paid: form.value.is_paid ? 1 : 0,
                is_active: form.value.is_active ? 1 : 0
            }

            await updatePurchaseHistory(currentPackage.value.id, payload)
            message.success('Gia hạn gói thành công')

            await registerPackage(customer.value)
            customer.value.packages = [...packageHistory.value]
            showDrawer.value = false
        } catch (e) {
            message.error('Lỗi khi gia hạn gói')
        }
    }


    function isExpired(dateStr) {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    }
</script>
