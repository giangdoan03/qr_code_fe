<template>
    <div>
        <a-page-header title="Quản lý khách hàng" style="padding-left: 0"/>

        <!-- Bộ lọc -->
        <a-row :gutter="[16, 16]" style="margin-bottom: 16px;">
            <a-col :span="4">
                <a-input v-model:value="filters.name" placeholder="Tên khách hàng" />
            </a-col>
            <a-col :span="4">
                <a-input v-model:value="filters.phone" placeholder="Số điện thoại" />
            </a-col>
            <a-col :span="4">
                <a-input v-model:value="filters.email" placeholder="Email" />
            </a-col>
            <a-col :span="4">
                <a-input v-model:value="filters.city" placeholder="Tỉnh/TP" />
            </a-col>
            <a-col :span="6">
                <a-range-picker v-model:value="filters.dateRange" style="width: 100%" />
            </a-col>
            <a-col :span="2">
                <a-button type="primary" block @click="fetchCustomers">Tìm kiếm</a-button>
            </a-col>
        </a-row>

        <div style="margin-bottom: 12px; display: flex; justify-content: flex-end">
            <a-button type="primary" @click="openDrawer">
                <template #icon><PlusOutlined /></template>
                Thêm khách hàng
            </a-button>
        </div>

        <a-table
                :columns="columns"
                :data-source="customers"
                :loading="loading"
                row-key="id"
                :pagination="pagination"
                @change="handleTableChange"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'avatar'">
                    <img v-if="record && record.avatar" :src="record.avatar" />
                </template>
                <template v-else-if="column.key === 'stt'">
                    {{ ((pagination?.current || 1) - 1) * (pagination?.pageSize || 10) + index + 1 }}
                </template>
                <template v-else-if="column.key === 'customer_status'">
                    <a-tag :color="getCustomerStatus(record) === 'Đang hoạt động' ? 'blue' : 'default'">
                        {{ getCustomerStatus(record) }}
                    </a-tag>
                </template>

                <template v-else-if="column.key === 'payment_status'">
                    <a-tag :color="record.payment_status === 'paid' ? 'green' : 'orange'">
                        {{ record.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'package_start_date'">
                    {{ record.package_start_date ? formatDate(record.package_start_date) : '—' }}
                </template>
                <template v-else-if="column.key === 'package_end_date'">
                  <span>
                    {{ formatDate(record.package_end_date) }}
                    <a-tag v-if="isExpired(record.package_end_date)" color="red" style="margin-left: 8px;">
                      Hết hạn
                    </a-tag>
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                    <a-space>
                        <a-tooltip title="Sửa khách hàng">
                            <a-button type="text" @click="editCustomer(record)">
                                <template #icon><EditOutlined /></template>
                            </a-button>
                        </a-tooltip>
                        <a-popconfirm title="Bạn có chắc muốn xoá?" @confirm="deleteCustomer(record.id)">
                            <a-tooltip title="Xoá">
                                <a-button type="text" danger>
                                    <template #icon><DeleteOutlined /></template>
                                </a-button>
                            </a-tooltip>
                        </a-popconfirm>
                        <a-tooltip title="Xem chi tiết">
                            <a-button type="text" @click="viewDetails(record)">
                                <template #icon><EyeOutlined /></template>
                            </a-button>
                        </a-tooltip>
                    </a-space>
                </template>
                <template v-else>
                    {{ record[column.key] }}
                </template>
            </template>
        </a-table>

        <!-- Drawer tạo/sửa khách hàng -->
        <a-drawer
                :open="drawerVisible"
                :title="isEditing ? 'Sửa khách hàng' : 'Thêm khách hàng'"
                @close="closeDrawer"
                width="500"
        >
            <a-form ref="formRef" layout="vertical" :model="form">
                <a-form-item label="Tên khách hàng" name="name" :rules="rules.name">
                    <a-input v-model:value="form.name" />
                </a-form-item>

                <a-form-item label="Email" name="email" :rules="rules.email">
                    <a-input v-model:value="form.email" />
                </a-form-item>

                <a-form-item label="Số điện thoại" name="phone" :rules="rules.phone">
                    <a-input v-model:value="form.phone" />
                </a-form-item>

                <a-form-item label="Tỉnh / Thành phố">
                    <a-input v-model:value="form.city" />
                </a-form-item>

                <a-form-item label="Địa chỉ">
                    <a-input v-model:value="form.address" />
                </a-form-item>

                <a-form-item label="Trạng thái" name="customer_status" :rules="rules.customer_status">
                    <a-select v-model:value="form.customer_status" placeholder="Chọn trạng thái">
                        <a-select-option :value="1">Đang hoạt động</a-select-option>
                        <a-select-option :value="2">Ngừng hoạt động</a-select-option>
                        <a-select-option :value="3">VIP</a-select-option>
                    </a-select>
                </a-form-item>


                <a-form-item v-if="!isEditing" label="Mật khẩu" name="password" :rules="rules.password">
                    <a-input-password v-model:value="form.password" />
                </a-form-item>

                <a-form-item v-if="!isEditing" label="Xác nhận mật khẩu" name="confirm_password" :rules="rules.confirm_password">
                    <a-input-password v-model:value="form.confirm_password" />
                </a-form-item>

                <a-form-item v-if="isEditing">
                    <a-checkbox v-model:checked="changePassword">Đổi mật khẩu</a-checkbox>
                </a-form-item>

                <a-form-item v-if="isEditing && changePassword" label="Mật khẩu mới" name="password" :rules="rules.password">
                    <a-input-password v-model:value="form.password" />
                </a-form-item>

                <a-form-item v-if="isEditing && changePassword" label="Xác nhận mật khẩu" name="confirm_password" :rules="rules.confirm_password">
                    <a-input-password v-model:value="form.confirm_password" />
                </a-form-item>

                <a-form-item>
                    <a-button type="primary" block @click="handleSubmit">
                        {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                    </a-button>
                </a-form-item>
            </a-form>
        </a-drawer>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
const router = useRouter()
import { h } from 'vue'
import { formatDate } from '../utils/formUtils.js'
import {
    EditOutlined,
    DeleteOutlined,
    ShoppingCartOutlined,
    EyeOutlined,
    PlusOutlined
} from '@ant-design/icons-vue'
import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer as deleteCustomerById
} from '../api/customer'

const customers = ref([])
const loading = ref(false)
const drawerVisible = ref(false)
const isEditing = ref(false)
const form = ref({
    years: 1,
    product_name: 'Gói Premium',
    is_active: true,
    is_paid: false // ✅ mặc định là chưa thanh toán
})
const formRef = ref()
const changePassword = ref(false)
let showDrawer = ref(false)
const filters = ref({ name: '', phone: '', email: '', city: '', dateRange: [] })
const pagination = ref({ current: 1, pageSize: 10, total: 0 })


const packageHistory = ref([])

const currentPackage = computed(() => {
    return packageHistory.value.find(
        (p) =>
            p.is_active === 1 &&
            p.is_paid === 1 &&
            dayjs(p.expires_at).isAfter(dayjs(), 'day')
    )
})

const columns = [
    { title: 'STT', key: 'stt' },
    { title: 'Tên khách hàng', key: 'name', dataIndex: 'name' },
    { title: 'Số điện thoại', key: 'phone', dataIndex: 'phone' },
    { title: 'Email', key: 'email', dataIndex: 'email' },
    { title: 'Địa chỉ', key: 'address', dataIndex: 'address' },
    { title: 'Tỉnh thành', key: 'city', dataIndex: 'city' },
    { title: 'Trạng thái KH', key: 'customer_status', dataIndex: 'customer_status_text' },
    { title: 'Thao tác', key: 'action' },
]


const rules = {
    name: [
        { required: true, message: 'Vui lòng nhập tên khách hàng', trigger: 'blur' }
    ],
    phone: [
        {
            validator: (_rule, value) => {
                if (!value) return Promise.reject('Vui lòng nhập số điện thoại')
                return /^(0|\+84)[0-9]{9,10}$/.test(value)
                    ? Promise.resolve()
                    : Promise.reject('Số điện thoại không hợp lệ')
            },
            trigger: 'blur'
        }
    ],
    email: [
        {
            type: 'email',
            message: 'Email không hợp lệ',
            trigger: 'blur'
        }
    ],
    customer_status: [
        { required: true, message: 'Vui lòng chọn trạng thái khách hàng', trigger: 'change' }
    ],
    password: [
        {
            validator: (_rule, value) => {
                if ((!isEditing.value || changePassword.value) && !value) {
                    return Promise.reject('Vui lòng nhập mật khẩu')
                }
                if (value && value.length < 6) {
                    return Promise.reject('Mật khẩu phải có ít nhất 6 ký tự')
                }
                return Promise.resolve()
            },
            trigger: 'blur'
        }
    ],
    confirm_password: [
        {
            validator: (_rule, value) => {
                if ((!isEditing.value || changePassword.value) && form.value.password && value !== form.value.password) {
                    return Promise.reject('Mật khẩu không khớp')
                }
                return Promise.resolve()
            },
            trigger: 'blur'
        }
    ]
}

const viewDetails = (record) => {
    router.push(`/customers/${record.id}`)
}

const fetchCustomers = async () => {
    loading.value = true
    try {
        const params = {
            page: pagination.value.current,
            per_page: pagination.value.pageSize,
            search: filters.value.name,
            phone: filters.value.phone,
            email: filters.value.email,
            city: filters.value.city,
            from: filters.value.dateRange[0] ? dayjs(filters.value.dateRange[0]).format('YYYY-MM-DD') : undefined,
            to: filters.value.dateRange[1] ? dayjs(filters.value.dateRange[1]).format('YYYY-MM-DD') : undefined
        }

        const res = await getCustomers(params)
        customers.value = res.data.data.map((customer) => {
            const latestPackage = customer.packages?.[0] ?? null

            return {
                ...customer,
                packages: Array.isArray(customer.packages) ? customer.packages : [],
                status: Number(customer.status),
                customer_status_text: statusLabel(Number(customer.status)),
                customer_status: Number(customer.status),
                package_start_date: latestPackage?.starts_at ?? null,
                package_end_date: latestPackage?.expires_at ?? null,
                payment_status: latestPackage?.is_paid === '1' ? 'paid' : 'unpaid',
                note: latestPackage?.note ?? ''
            }
        })


        pagination.value.total = res.data.pager.total
    } catch (e) {
        message.error('Không thể tải danh sách khách hàng')
    } finally {
        loading.value = false
    }
}


function isExpired(dateString) {
    if (!dateString) return true;
    return new Date(dateString) < new Date(); // true nếu đã hết hạn
}

function getCustomerStatus(record) {
    return record.payment_status === 'paid' && !isExpired(record.package_end_date)
        ? 'Đang hoạt động'
        : 'Ngừng hoạt động';
}

const getDisplayStatus = (record) => {
    const isPaid = record.payment_status === 'paid'
    const isExpiredPkg = isExpired(record.package_end_date)

    if (!isPaid) return 2 // Ngừng hoạt động
    if (isExpiredPkg) return 4 // Hết hạn
    return 1 // Đang hoạt động
}

const openDrawer = () => {
    isEditing.value = false
    form.value = {
        name: '',
        email: '',
        phone: '',
        city: '',
        address: '',
        customer_status: 2, // ✅ Ngừng hoạt động
        password: '',
        confirm_password: ''
    }
    drawerVisible.value = true
}



const editCustomer = (record) => {
    isEditing.value = true;

    let duration = undefined;
    if (record.package_start_date && record.package_end_date) {
        const start = dayjs(record.package_start_date);
        const end = dayjs(record.package_end_date);
        const diffYears = end.diff(start, 'year');
        duration = diffYears > 0 ? diffYears : undefined;
    }

    // Ép kiểu chính xác và debug rõ
    const status = Number(record.status);
    console.log('🟦 record.status =', record.status, '| typeof =', typeof record.status);

    form.value = {
        id: record.id,
        name: record.name,
        email: record.email,
        phone: record.phone,
        city: record.city,
        address: record.address,
        customer_status: Number(record.status),
        package_duration_years: duration
    };

    changePassword.value = false;
    drawerVisible.value = true;
};



const closeDrawer = () => {
    drawerVisible.value = false
}

const handleSubmit = () => {
    formRef.value
        .validate()
        .then(saveCustomer)
        .catch(() => {
            message.warning('Vui lòng kiểm tra lại các trường bắt buộc')
        })
}

const saveCustomer = async () => {
    try {
        if (isEditing.value) {
            // ✳ Gộp dữ liệu cần gửi
            const payload = {
                name: form.value.name,
                email: form.value.email,
                phone: form.value.phone,
                city: form.value.city,
                address: form.value.address,
                status: form.value.customer_status
            }

            // ✳ Nếu đang chọn đổi mật khẩu
            if (changePassword.value) {
                if (form.value.password) {
                    payload.password = form.value.password
                }
                if (form.value.confirm_password) {
                    payload.confirm_password = form.value.confirm_password
                }
            }

            await updateCustomer(form.value.id, payload)
            message.success('Cập nhật thành công')
        } else {
            // ✳ Gửi toàn bộ form khi thêm mới
            const payload = {
                name: form.value.name,
                email: form.value.email,
                phone: form.value.phone,
                city: form.value.city,
                address: form.value.address,
                status: form.value.customer_status,
                password: form.value.password,
                confirm_password: form.value.confirm_password
            }

            await createCustomer(payload)
            message.success('Thêm thành công')
        }

        drawerVisible.value = false
        await fetchCustomers()
    } catch (e) {
        console.error(e)
        message.error('Lỗi khi lưu thông tin khách hàng')
    }
}


const deleteCustomer = async (id) => {
    try {
        await deleteCustomerById(id)
        message.success('Đã xoá khách hàng')
        await fetchCustomers()
    } catch (e) {
        message.error('Không thể xoá khách hàng')
    }
}

const statusLabel = (status) => {
    switch (parseInt(status)) {
        case 0: return 'Mới'
        case 1: return 'Đang hoạt động'
        case 2: return 'Ngừng hoạt động'
        case 3: return 'VIP'
        case 4: return 'Hết hạn'
        default: return 'Không rõ'
    }
}


const handleTableChange = (pager) => {
    pagination.value.current = pager.current
    pagination.value.pageSize = pager.pageSize
    fetchCustomers()
}
fetchCustomers()
</script>
