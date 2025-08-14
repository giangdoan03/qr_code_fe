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

        <a-space style="margin-bottom: 16px;">
            <a-button
                    danger
                    :disabled="!selectedRowKeys.length"
                    @click="confirmBulkDelete"
            >
                Xoá đã chọn ({{ selectedRowKeys.length }})
            </a-button>
            <a-button type="primary" @click="openDrawer">
                <template #icon><PlusOutlined /></template>
                Thêm khách hàng
            </a-button>
        </a-space>

        <a-table
            class="tiny-scroll"
                :columns="columns"
                :data-source="customers"
                :loading="loading"
                row-key="id"
                :pagination="pagination"
                @change="handleTableChange"
                :scroll="{ x: 1000 }"
                :row-selection="rowSelection"
        >
            <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'avatar'">
                    <img v-if="record && record.avatar" :src="record.avatar" />
                </template>
                <template v-else-if="column.key === 'company_name'">
                    <!-- Nếu là doanh nghiệp: hiện tên + tooltip -->
                    <template v-if="record.customer_type === 'business'">
                        <a-tooltip
                            v-if="record.company_name"
                            :title="record.company_name"
                            placement="topLeft"
                            :overlayStyle="{ maxWidth: '480px', whiteSpace: 'normal' }"
                        >
                            <span class="cell-ellipsis">{{ record.company_name }}</span>
                        </a-tooltip>
                        <span v-else>—</span>
                    </template>

                    <!-- Nếu là cá nhân: hiện tag loại KH -->
                    <a-tag v-else :color="record.customer_type === 'business' ? 'purple' : 'green'">
                        {{ record.customer_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân' }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'stt'">
                    {{ ((pagination?.current || 1) - 1) * (pagination?.pageSize || 10) + index + 1 }}
                </template>
                <template v-else-if="column.key === 'customer_status'">
                    <a-tag :color="getCustomerStatus(record) === 'Đang hoạt động' ? 'blue' : 'default'">
                        {{ getCustomerStatus(record) }}
                    </a-tag>
                </template>
                <template v-else-if="column.key === 'customer_type'">
                    <a-tag :color="record.customer_type === 'business' ? 'purple' : 'green'">
                        {{ record.customer_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân' }}
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

                <template v-else-if="column.key === 'address'">
                    <a-tooltip
                        v-if="record.address"
                        :title="record.address"
                        placement="topLeft"
                        :overlayStyle="{ maxWidth: '480px', whiteSpace: 'normal' }"
                    >
                        <span class="cell-ellipsis">{{ record.address }}</span>
                    </a-tooltip>
                    <span v-else>—</span>
                </template>

                <template v-else-if="column.key === 'qr_used'">
                    <a-tag v-if="!isUnlimited(record)" color="processing" style="margin-left:8px;">
                        <span>{{ record.qr_used ?? 0 }}</span>
                    </a-tag>
                </template>

                <template v-else-if="column.key === 'qr_quota'">
                    <a-tag v-if="isUnlimited(record)" color="blue">Không giới hạn</a-tag>
                    <span v-else>{{ record.qr_quota }}</span>
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
                width="800"
        >
            <a-form ref="formRef" layout="vertical" :model="form">
                <!-- Loại khách hàng -->
                <a-form-item>
                    <a-radio-group v-model:value="customerType" button-style="solid" @change="onTypeChange">
                        <a-radio-button
                                value="personal"
                                :disabled="isEditing && customerType === 'business'"
                        >
                            Khách hàng cá nhân
                        </a-radio-button>
                        <a-radio-button
                                value="business"
                                :disabled="isEditing && customerType === 'personal'"
                        >
                            Khách hàng doanh nghiệp
                        </a-radio-button>
                    </a-radio-group>
                </a-form-item>

                <!-- Chỉ hiện khi Doanh nghiệp -->
                <a-row :gutter="[16,16]">
                    <template v-if="customerType === 'business'">
                        <a-col :xs="24" :md="12">
                            <a-form-item label="Tên doanh nghiệp" name="company_name" :rules="rules.company_name">
                                <a-input v-model:value="form.company_name" />
                            </a-form-item>
                        </a-col>
                        <a-col :xs="24" :md="12">
                            <a-form-item label="Mã số thuế" name="tax_code" :rules="rules.tax_code">
                                <a-input v-model:value="form.tax_code" />
                            </a-form-item>
                        </a-col>
                    </template>
                </a-row>

                <a-row :gutter="[16,16]">
                    <a-col :xs="24" :md="12">
                        <a-form-item :label="nameLabel" name="name" :rules="rules.name">
                            <a-input v-model:value="form.name" />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="12">
                        <a-form-item label="Email" name="email" :rules="rules.email">
                            <a-input v-model:value="form.email" />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="12">
                        <a-form-item label="Số điện thoại" name="phone" :rules="rules.phone">
                            <a-input v-model:value="form.phone" />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="12">
                        <a-form-item label="Tỉnh / Thành phố" :rules="rules.city">
                            <a-input v-model:value="form.city" />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="12">
                        <a-form-item label="Địa chỉ" :rules="rules.address">
                            <a-input v-model:value="form.address" />
                        </a-form-item>
                    </a-col>

                    <a-col :xs="24" :md="12">
                        <a-form-item label="Trạng thái" name="customer_status" :rules="rules.customer_status">
                            <a-select v-model:value="form.customer_status" placeholder="Chọn trạng thái">
                                <a-select-option :value="1">Đang hoạt động</a-select-option>
                                <a-select-option :value="2">Ngừng hoạt động</a-select-option>
                                <a-select-option :value="3">VIP</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <template v-if="!isEditing">
                        <a-col :xs="24" :md="12">
                            <a-form-item label="Mật khẩu" name="password" :rules="rules.password">
                                <a-input-password v-model:value="form.password" />
                            </a-form-item>
                        </a-col>
                        <a-col :xs="24" :md="12">
                            <a-form-item label="Xác nhận mật khẩu" name="confirm_password" :rules="rules.confirm_password">
                                <a-input-password v-model:value="form.confirm_password" />
                            </a-form-item>
                        </a-col>
                    </template>

                    <a-col :span="24" v-if="isEditing">
                        <a-form-item>
                            <a-checkbox v-model:checked="changePassword">Đổi mật khẩu</a-checkbox>
                        </a-form-item>
                    </a-col>

                    <template v-if="isEditing && changePassword">
                        <a-col :xs="24" :md="12">
                            <a-form-item label="Mật khẩu mới" name="password" :rules="rules.password">
                                <a-input-password v-model:value="form.password" />
                            </a-form-item>
                        </a-col>
                        <a-col :xs="24" :md="12">
                            <a-form-item label="Xác nhận mật khẩu" name="confirm_password" :rules="rules.confirm_password">
                                <a-input-password v-model:value="form.confirm_password" />
                            </a-form-item>
                        </a-col>
                    </template>

                    <a-col :span="24">
                        <a-form-item label="Số lượng QR cho phép">
                            <div style="display:flex;gap:12px;align-items:center">
                                <a-form-item name="qr_quota" no-style>
                                    <a-input-number v-model:value="form.qr_quota" :min="1" :precision="0" :disabled="unlimited" style="width:160px" />
                                </a-form-item>
                                <a-form-item-rest>
                                    <a-checkbox v-model:checked="unlimited">Không giới hạn</a-checkbox>
                                </a-form-item-rest>
                            </div>
                        </a-form-item>
                    </a-col>

                    <a-col :span="5">
                        <a-form-item>
                            <a-button type="primary" block @click="handleSubmit">
                                {{ isEditing ? 'Cập nhật' : 'Tạo mới' }}
                            </a-button>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>

        </a-drawer>
    </div>
</template>

<script setup>
import { ref, computed, watch} from 'vue'
import { Modal, message } from 'ant-design-vue'
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
const unlimited = ref(false);
const customers = ref([])
const loading = ref(false)
const drawerVisible = ref(false)
const isEditing = ref(false)
const customerType = ref('personal')
const form = ref({
    years: 1,
    product_name: 'Gói Premium',
    is_active: true,
    is_paid: false, // ✅ mặc định là chưa thanh toán
    qr_quota: 1, // null = không giới hạn

})
const formRef = ref()
const changePassword = ref(false)
let showDrawer = ref(false)
const filters = ref({ name: '', phone: '', email: '', city: '', dateRange: [] })
const pagination = ref({ current: 1, pageSize: 10, total: 0 })

// Khi tick "Không giới hạn" → đặt null
watch(unlimited, v => { if (v) form.qr_quota = null; });



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
    { title: 'STT', key: 'stt',width: 80, className: 'no-wrap', ellipsis: true },
    { title: 'Tên doanh nghiệp', key: 'company_name', dataIndex: 'company_name', width: 260, className: 'no-wrap', ellipsis: true },
    { title: 'Tên khách hàng', key: 'name', dataIndex: 'name', width: 150, className: 'no-wrap', ellipsis: true },
    { title: 'Số điện thoại', key: 'phone', dataIndex: 'phone', width: 150, className: 'no-wrap', ellipsis: true },
    { title: 'Email', key: 'email', dataIndex: 'email', width: 260, className: 'no-wrap', ellipsis: true },
    { title: 'Địa chỉ', key: 'address', dataIndex: 'address', width: 260, className: 'no-wrap', ellipsis: true },
    { title: 'Tỉnh thành', key: 'city', dataIndex: 'city', width: 150, className: 'no-wrap', ellipsis: true },
    {
        title: 'Loại KH',
        key: 'customer_type',
        dataIndex: 'customer_type',
        align: 'center',
        width: 150, className: 'no-wrap', ellipsis: true,
        // (tuỳ chọn) lọc nhanh client-side:
        filters: [
            { text: 'Cá nhân', value: 'personal' },
            { text: 'Doanh nghiệp', value: 'business' },
        ],
        onFilter: (value, record) => record.customer_type === value,
    },
    { title: 'Trạng thái KH', key: 'customer_status', dataIndex: 'customer_status_text', width: 180, className: 'no-wrap', ellipsis: true },
    { title: 'QR đã tạo', key: 'qr_used', dataIndex: 'qr_used', align: 'center', width: 150, className: 'no-wrap', ellipsis: true },
    { title: 'QR cho phép', key: 'qr_quota', dataIndex: 'qr_quota', align: 'center', width: 150, className: 'no-wrap', ellipsis: true },
    { title: 'Thao tác', key: 'action' , width: 150, className: 'no-wrap', ellipsis: true},
]

const isUnlimited = (row) =>
    row.qr_quota === null || row.qr_quota === undefined;

const remaining = (row) => {
    if (isUnlimited(row)) return null;
    const quota = Number(row.qr_quota) || 0;
    const used  = Number(row.qr_used)  || 0;
    return Math.max(0, quota - used);
};


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
        { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
        {
            type: 'email',
            message: 'Email không hợp lệ',
            trigger: 'blur'
        }
    ],
    city: [
        { required: true, message: 'Vui lòng nhập tỉnh/tp', trigger: 'blur' }
    ],
    address: [
        { required: true, message: 'Vui lòng nhập địa chỉ', trigger: 'blur' }
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
    ],
    qr_quota: [
        {
            validator: (_, v) => {
                if (unlimited.value) return Promise.resolve();
                if (v === '' || v === null || v === undefined) {
                    return Promise.reject('Nhập số lượng hoặc chọn Không giới hạn');
                }
                const n = Number(v);
                return Number.isInteger(n) && n >= 0
                    ? Promise.resolve()
                    : Promise.reject('Phải là số nguyên ≥ 0');
            },
            trigger: 'change',
        },
    ],
}


const CUSTOMER_TYPES = { PERSONAL: 'personal', BUSINESS: 'business' }

// đổi nhãn theo loại
const nameLabel = computed(() =>
    customerType.value === CUSTOMER_TYPES.BUSINESS ? 'Người liên hệ' : 'Tên khách hàng'
)

// thêm 2 trường vào model (nhớ merge vào form hiện có của bạn)
form.company_name = form.company_name ?? ''
form.tax_code = form.tax_code ?? ''
// nếu cần gửi lên BE:
form.customer_type = form.customer_type ?? CUSTOMER_TYPES.PERSONAL

// rules bổ sung (giữ rules cũ của bạn, chỉ thêm 2 cái dưới)
rules.company_name = [
    {
        validator: (_, v) =>
            customerType.value === CUSTOMER_TYPES.BUSINESS && !v
                ? Promise.reject('Vui lòng nhập Tên doanh nghiệp')
                : Promise.resolve(),
    },
]
rules.tax_code = [
    {
        validator: (_, v) => {
            if (customerType.value !== CUSTOMER_TYPES.BUSINESS) return Promise.resolve()
            if (!v) return Promise.reject('Vui lòng nhập Mã số thuế')
            return /^\d{10}(\d{3})?$/.test(v)
                ? Promise.resolve()
                : Promise.reject('MST chỉ gồm 10 hoặc 13 chữ số')
        },
    },
]

// khi đổi loại, xoá/clear validate các trường DN nếu chuyển sang cá nhân
const onTypeChange = () => {
    form.value.customer_type = customerType.value
    if (customerType.value === 'personal') {
        // về cá nhân thì clear field DN
        form.value.company_name = ''
        form.value.tax_code = ''
        formRef?.value?.clearValidate?.(['company_name','tax_code'])
    }
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
            company_name: filters.value.company_name,
            tax_code: filters.value.tax_code,
            from: filters.value.dateRange[0] ? dayjs(filters.value.dateRange[0]).format('YYYY-MM-DD') : undefined,
            to: filters.value.dateRange[1] ? dayjs(filters.value.dateRange[1]).format('YYYY-MM-DD') : undefined
        }

        const res = await getCustomers(params)
        customers.value = res.data.data.map((customer) => {
            const latestPackage = customer.packages?.[0] ?? null
            return {
                ...customer,
                customer_type: customer.customer_type ?? 'personal',
                packages: Array.isArray(customer.packages) ? customer.packages : [],
                status: Number(customer.status),
                customer_status_text: statusLabel(Number(customer.status)),
                customer_status: Number(customer.status),
                package_start_date: latestPackage?.starts_at ?? null,
                package_end_date: latestPackage?.expires_at ?? null,
                payment_status: latestPackage?.is_paid === '1' ? 'paid' : 'unpaid',
                qr_quota: customer.qr_quota,
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
    return record.payment_status === 'paid' && !isExpired(record.package_end_date) ? 'Đang hoạt động' : 'Ngừng hoạt động';
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
        confirm_password: '',
        qr_quota: 1,
        company_name: '',
        tax_code: ''
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
    customerType.value = record.customer_type === 'business' ? 'business' : 'personal'

    // Ép kiểu chính xác và debug rõ
    const status = Number(record.status);
    console.log('record',record)

    form.value = {
        id: record.id,
        name: record.name,
        email: record.email,
        phone: record.phone,
        city: record.city,
        address: record.address,
        customer_status: Number(record.status),
        package_duration_years: duration,
        qr_quota: record.qr_quota,
        company_name: record.company_name,
        tax_code: record.tax_code,
        customer_type: customerType.value,
    };

    changePassword.value = false;
    drawerVisible.value = true;
};



const closeDrawer = () => {
    drawerVisible.value = false
}

const mapCustomerStatus = (val) => {
    switch (val) {
        case 1: return 'active';
        case 2: return 'inactive';
        case 3: return 'vip';
        default: return 'new';
    }
};

// chuẩn hoá chuỗi: '' -> null, trim khoảng trắng
const clean = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
};

// chuẩn hoá quota: null nếu không giới hạn; số nguyên ≥0 nếu có
const normalizeQuota = () => {
    if (unlimited.value) return null;
    const q = form.value.qr_quota;
    if (q === '' || q === null || q === undefined) return 0;
    const n = parseInt(q, 10);
    return Number.isInteger(n) && n >= 0 ? n : 0;
};

const handleSubmit = async () => {
    try {
        await formRef.value.validate();
        await saveCustomer();
    } catch (err) {
        message.warning('Vui lòng kiểm tra lại các trường bắt buộc');
    }
};

const saveCustomer = async () => {
    loading.value = true;
    try {
        // payload chung
        const basePayload = {
            name:   clean(form.value.name),
            email:  clean(form.value.email),
            phone:  clean(form.value.phone),
            city:   clean(form.value.city),
            address: clean(form.value.address),
            customer_status: mapCustomerStatus(form.value.customer_status),
            qr_quota: normalizeQuota(),
            company_name: clean(form.value.company_name),
            tax_code: clean(form.value.tax_code),
            customer_type: customerType.value,
        };

        if (isEditing.value) {
            // chỉ gửi password nếu có tick đổi mật khẩu
            if (changePassword.value) {
                if (clean(form.value.password))         basePayload.password = form.value.password;
                if (clean(form.value.confirm_password)) basePayload.confirm_password = form.value.confirm_password;
            }

            await updateCustomer(form.value.id, basePayload);
            message.success('Cập nhật thành công');
        } else {
            // tạo mới: cần mật khẩu + xác nhận
            const createPayload = {
                ...basePayload,
                password:         form.value.password,
                confirm_password: form.value.confirm_password,
            };
            await createCustomer(createPayload);
            message.success('Thêm thành công');
        }

        drawerVisible.value = false;
        await fetchCustomers();
    } catch (e) {
        console.error(e);
        message.error(e?.message || 'Lỗi khi lưu thông tin khách hàng');
    } finally {
        loading.value = false;
    }
};


const deleteCustomer = async (id) => {
    try {
        await deleteCustomerById(id)
        message.success('Đã xoá khách hàng')
        await fetchCustomers()
    } catch (e) {
        message.error('Không thể xoá khách hàng')
    }
}


// 2) Cấu hình rowSelection (check all có sẵn ở header)
const selectedRowKeys = ref([])

const rowSelection = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    // chọn theo trang và vẫn giữ khi chuyển trang
    preserveSelectedRowKeys: true,
    onChange: (keys) => {
        selectedRowKeys.value = keys
    }
}))


// 3) Xoá hàng loạt
const confirmBulkDelete = () => {
    if (!selectedRowKeys.value.length) return
    Modal.confirm({
        title: `Xoá ${selectedRowKeys.value.length} khách hàng?`,
        content: 'Hành động này không thể hoàn tác.',
        okText: 'Xoá',
        okType: 'danger',
        cancelText: 'Huỷ',
        async onOk() {
            loading.value = true
            try {
                // Nếu có API xoá hàng loạt, dùng:
                // await deleteCustomersBulk(selectedRowKeys.value)

                // Không có API bulk: gọi tuần tự/parallel
                const results = await Promise.allSettled(
                    selectedRowKeys.value.map((id) => deleteCustomerById(id))
                )
                const ok = results.filter(r => r.status === 'fulfilled').length
                const fail = results.length - ok

                if (ok) message.success(`Đã xoá ${ok} khách hàng`)
                if (fail) message.warning(`${fail} khách không xoá được`)

                selectedRowKeys.value = []
                await fetchCustomers()
            } catch (e) {
                message.error('Không thể xoá các khách đã chọn')
            } finally {
                loading.value = false
            }
        },
    })
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

<style scoped>
/* nếu <style scoped> thì dùng :deep */
:deep(.ant-table-thead th.no-wrap),
:deep(.ant-table-tbody td.no-wrap) {
    white-space: nowrap;         /* không cho xuống dòng */
    overflow: hidden;            /* ẩn phần tràn */
    text-overflow: ellipsis;     /* hiện … */
    word-break: normal;          /* không bẻ chữ giữa chừng */
    overflow-wrap: normal;
}


</style>
<style>
/* Firefox */
.tiny-scroll .ant-table-body,
.tiny-scroll .ant-table-content,
.tiny-scroll .ant-table-header {
    scrollbar-width: thin;                         /* mảnh hơn */
    scrollbar-color: rgba(0,0,0,.35) transparent;  /* màu tay kéo */
}

/* Chrome/Edge/Safari */
.tiny-scroll .ant-table-body::-webkit-scrollbar,
.tiny-scroll .ant-table-content::-webkit-scrollbar,
.tiny-scroll .ant-table-header::-webkit-scrollbar {
    width: 6px;   /* dọc */
    height: 6px;  /* ngang – chỉnh xuống 4px nếu muốn nhỏ nữa */
}
.tiny-scroll .ant-table-body::-webkit-scrollbar-thumb,
.tiny-scroll .ant-table-content::-webkit-scrollbar-thumb,
.tiny-scroll .ant-table-header::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,.35);
    border-radius: 6px;
}
.tiny-scroll .ant-table-body::-webkit-scrollbar-track,
.tiny-scroll .ant-table-content::-webkit-scrollbar-track,
.tiny-scroll .ant-table-header::-webkit-scrollbar-track {
    background: transparent;
}
</style>
