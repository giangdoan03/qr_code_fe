<template>
    <div>
        <a-page-header title="Thông tin người dùng & Cài đặt" class="header-title" />

        <a-form layout="vertical" @submit.prevent>
            <a-tabs v-model:activeKey="activeTab">
                <!-- Tab: Thông tin người dùng -->
                <a-tab-pane key="userInfo" tab="Thông tin người dùng">
                    <a-row :gutter="16">
                        <a-col :xs="24" :md="12">
                            <a-card>
                                <a-form-item label="Tên người dùng">
                                    <a-input v-model:value="userInfo.name" placeholder="Nhập tên" />
                                </a-form-item>

                                <a-form-item label="Email">
                                    <a-input v-model:value="userInfo.email" disabled />
                                </a-form-item>

                                <a-form-item label="Số điện thoại">
                                    <a-input v-model:value="userInfo.phone" />
                                </a-form-item>

                                <a-form-item label="Vai trò">
                                    <a-input v-model:value="userInfo.role" disabled />
                                </a-form-item>

                                <a-form-item label="Trạng thái">
                                    <a-tag color="purple" v-if="userInfo.status === '3'">
                                        VIP – còn {{ remainingDays(userInfo.package_end_date) }} ngày
                                    </a-tag>
                                    <a-tag color="red" v-else-if="userInfo.status === '4'">Hết hạn</a-tag>
                                    <a-tag color="green" v-else-if="userInfo.status === '1'">
                                        Đang hoạt động – còn {{ remainingDays(userInfo.package_end_date) }} ngày
                                    </a-tag>
                                    <a-tag v-else>Không rõ</a-tag>
                                </a-form-item>


                                <a-form-item>
                                    <a-checkbox v-model:checked="changePassword">Đổi mật khẩu</a-checkbox>
                                </a-form-item>

                                <a-form-item label="Mật khẩu hiện tại" v-if="changePassword">
                                    <a-input-password v-model:value="passwordForm.current" placeholder="Nhập mật khẩu hiện tại" />
                                </a-form-item>

                                <a-form-item label="Mật khẩu mới" v-if="changePassword">
                                    <a-input-password v-model:value="passwordForm.new" placeholder="Nhập mật khẩu mới" />
                                </a-form-item>

                                <a-form-item label="Xác nhận mật khẩu mới" v-if="changePassword">
                                    <a-input-password v-model:value="passwordForm.confirm" placeholder="Nhập lại mật khẩu mới" />
                                </a-form-item>

                                <a-form-item label="Ảnh đại diện / Ảnh logo">
                                    <template v-if="isEditing">
                                        <a-upload
                                            list-type="picture-card"
                                            :file-list="logoFileList"
                                            :on-preview="handlePreview"
                                            :on-remove="(file) => handleRemoveFile('logo', file)"
                                            :before-upload="(file) => handleBeforeUploadSingle('logo', file)"
                                            :max-count="1"
                                        >
                                            <div v-if="logoFileList.length === 0">
                                                <upload-outlined />
                                                <div style="margin-top: 8px">Tải ảnh</div>
                                            </div>
                                        </a-upload>
                                    </template>
                                    <template v-else>
                                        <div v-if="userInfo.avatar">
                                            <a-image
                                                :src="userInfo.avatar"
                                                style="width: 100px; height: 100px; object-fit: cover"
                                            />
                                        </div>
                                        <div v-else>
                                            <a-avatar
                                                :size="{ xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 }"
                                                style="background-color: #f5f5f5; display: inline-flex; align-items: center; justify-content: center"
                                            >
                                                <template #icon>
                                                    <AntDesignOutlined />
                                                </template>
                                            </a-avatar>
                                        </div>
                                    </template>
                                </a-form-item>


                            </a-card>
                        </a-col>
                    </a-row>
                </a-tab-pane>

                <!-- Tab: Cài đặt người dùng -->
                <a-tab-pane key="userSettings" tab="Cài đặt người dùng">
                    <a-table
                        :columns="columns"
                        :data-source="settings"
                        row-key="id"
                        :loading="loading"
                        :pagination="false"
                    >
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" @click="edit(record)">Sửa</a-button>
                                    <a-popconfirm title="Xoá cài đặt này?" @confirm="remove(record.id)">
                                        <a-button type="link" danger>Xoá</a-button>
                                    </a-popconfirm>
                                </a-space>
                            </template>
                        </template>
                    </a-table>

                    <a-divider />

                    <a-form layout="inline">
                        <a-form-item>
                            <a-input v-model:value="newSetting.key" placeholder="Key" />
                        </a-form-item>
                        <a-form-item>
                            <a-input v-model:value="newSetting.value" placeholder="Value" />
                        </a-form-item>
                    </a-form>
                </a-tab-pane>
            </a-tabs>

            <!-- Nút lưu tổng hợp -->
            <a-form-item style="margin-top: 24px">
                <a-button type="primary" @click="saveAll">Lưu tất cả</a-button>
            </a-form-item>
        </a-form>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { AntDesignOutlined, UploadOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import {
    getSettings,
    createSetting,
    deleteSetting,
    updateSetting
} from '../api/setting'

import { updateUser, changePasswordAPI, getCurrentUser } from '../api/user'
import { useUserStore } from '../stores/user'

const activeTab = ref('userInfo')
const userStore = useUserStore()
const userInfo = ref({})
const changePassword = ref(false)
const passwordForm = reactive({
    current: '',
    new: '',
    confirm: ''
})

const settings = ref([])
const loading = ref(false)
const newSetting = ref({ id: null, key: '', value: '' })

const isEditing = ref(true)

const previewImage = ref('');
const previewVisible = ref(false);
const previewTitle = ref('');

const columns = [
    { title: 'Key', dataIndex: 'key', key: 'key' },
    { title: 'Value', dataIndex: 'value', key: 'value' },
    { title: 'Hành động', key: 'action' }
]

onMounted(async () => {
    try {
        const res = await getCurrentUser() // ✅ không truyền tham số
        userInfo.value = res.data

        // Nếu có avatar thì set preview luôn
        if (userInfo.value.avatar) {
            logoFileList.value = [
                {
                    uid: '-1',
                    name: 'avatar',
                    status: 'done',
                    url: userInfo.value.avatar
                }
            ]
        }
    } catch (e) {
        message.error('Không thể tải thông tin người dùng')
    }

    await fetchSettings()
})


import {uploadFile} from '../api/product'

// Avatar upload
const logoFileList = ref([])

const handleBeforeUploadSingle = async (field, file) => {
    const { data } = await uploadFile(file)

    // ✅ Gán trực tiếp vào userInfo.avatar
    userInfo.value.avatar = data.url

    // ✅ Cập nhật file list để preview
    logoFileList.value = [
        {
            uid: Date.now(),
            name: file.name,
            status: 'done',
            url: data.url
        }
    ]

    return false // Ngăn upload mặc định
}


const handleRemoveFile = (field, file) => {
    if (field === 'logo') {
        userInfo.value.avatar = null
        logoFileList.value = []
    }
}

const updateFileList = (field, url) => {
    const item = {
        uid: Date.now(),
        name: 'Ảnh',
        status: 'done',
        url: url
    }
    if (field === 'logo') logoFileList.value = [item]
}

const handlePreview = (file) => {
    previewImage.value = file.url || file.thumbUrl
    previewVisible.value = true
    previewTitle.value = file.name || ''
}


const fetchSettings = async () => {
    loading.value = true
    try {
        const res = await getSettings()
        settings.value = res.data
    } catch (err) {
        message.error('Không thể tải cài đặt')
    } finally {
        loading.value = false
    }
}

const remainingDays = (endDate) => {
    if (!endDate) return null
    const today = dayjs()
    const end = dayjs(endDate)
    const diff = end.diff(today, 'day')
    return diff >= 0 ? diff : 0
}

const edit = (item) => {
    newSetting.value = { ...item }
}

const remove = async (id) => {
    try {
        await deleteSetting(id)
        message.success('Đã xoá')
        await fetchSettings()
    } catch (err) {
        message.error('Lỗi khi xoá')
    }
}

const saveAll = async () => {
    try {
        // Cập nhật thông tin người dùng
        await updateUser(userInfo.value.id, {
            name: userInfo.value.name,
            phone: userInfo.value.phone,
            status: userInfo.value.status,
            avatar: userInfo.value.avatar
        })

        // Đổi mật khẩu nếu có chọn
        if (changePassword.value) {
            if (passwordForm.new !== passwordForm.confirm) {
                return message.error('Mật khẩu mới không khớp')
            }
            await changePasswordAPI({
                current_password: passwordForm.current,
                new_password: passwordForm.new
            })
            message.success('Đã đổi mật khẩu thành công')
        }

        // Lưu cài đặt nếu có
        if (newSetting.value.key && newSetting.value.value) {
            if (newSetting.value.id) {
                await updateSetting(newSetting.value.id, newSetting.value)
                message.success('Đã cập nhật cài đặt')
            } else {
                await createSetting(newSetting.value)
                message.success('Đã thêm cài đặt')
            }
            newSetting.value = { id: null, key: '', value: '' }
            await fetchSettings()
        }

        message.success('Đã lưu toàn bộ thông tin')
    } catch (err) {
        console.error('Lỗi khi lưu:', err)
        message.error(err?.response?.data?.message || 'Lỗi khi lưu dữ liệu')
    }
}
</script>
<style>
.header-title {
    padding-left: 0;
    padding-right: 0;
    padding-top: 0;
}
</style>
