<template>
    <div>
        <a-space style="margin-bottom: 16px">
            <a-button type="primary" @click="fetchUsers">Tải danh sách người dùng</a-button>
        </a-space>

        <a-table
            :columns="columns"
            :data-source="users"
            row-key="id"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
        >
            <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'role_id'">
                    <a-select
                        v-model:value="record.role_id"
                        style="width: 160px"
                        @change="value => updateUserRole(record.id, value)"
                    >
                        <a-select-option
                            v-for="role in roles"
                            :key="role.id"
                            :value="role.id"
                        >
                            {{ role.name }}
                        </a-select-option>
                    </a-select>
                </template>
            </template>
        </a-table>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, updateUserRoleApi, getRoles } from '../api/permission'
import { message } from 'ant-design-vue'

const users = ref([])
const roles = ref([])
const loading = ref(false)

const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên người dùng', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Vai trò', dataIndex: 'role_id', key: 'role_id' }
]

const fetchRoles = async () => {
    try {
        const res = await getRoles()
        roles.value = res.data
    } catch (e) {
        message.error('Không thể tải vai trò')
    }
}

const fetchUsers = async () => {
    loading.value = true
    try {
        const res = await getUsers()
        users.value = res.data
    } catch (e) {
        message.error('Không thể tải người dùng')
    } finally {
        loading.value = false
    }
}

const updateUserRole = async (userId, newRoleId) => {
    try {
        await updateUserRoleApi(userId, newRoleId)
        message.success('Cập nhật vai trò thành công')
    } catch (e) {
        message.error('Lỗi khi cập nhật vai trò')
    }
}

onMounted(() => {
    fetchRoles()
    fetchUsers()
})
</script>
