<template>
    <a-layout-header
        style="background: #fff; padding: 0; display: flex; justify-content: space-between; align-items: center;"
    >
        <div>
            <MenuUnfoldOutlined v-if="collapsed" class="trigger" @click="emit('toggle')" />
            <MenuFoldOutlined v-else class="trigger" @click="emit('toggle')" />
        </div>

        <!-- Breadcrumb -->
        <div style="flex: 1; margin-left: 16px;">
            <a-breadcrumb>
                <a-breadcrumb-item v-for="(route, index) in breadcrumbs" :key="index">
                    <router-link v-if="route.name !== currentRoute.name" :to="{ name: route.name }">
                        {{ route.meta.breadcrumb }}
                    </router-link>
                    <span v-else>{{ route.meta.breadcrumb }}</span>
                </a-breadcrumb-item>
            </a-breadcrumb>
        </div>

        <!-- User dropdown -->
        <div style="margin-right: 24px;">
            <a-dropdown>
                <a class="ant-dropdown-link" @click.prevent>
                    <p style="width: 200px; text-align: right">Xin chào, {{ user?.name }} <DownOutlined /></p>
                </a>
                <template #overlay>
                    <a-menu>
                        <a-menu-item key="profile">
                            <router-link :to="{ name: 'settings' }">Thông tin cá nhân</router-link>
                        </a-menu-item>
<!--                        <a-menu-item key="change-password">-->
<!--                            <router-link :to="{ name: 'settings' }">Đổi mật khẩu</router-link>-->
<!--                        </a-menu-item>-->
                        <a-menu-divider />
                        <a-menu-item key="logout" @click="confirmLogout">Đăng xuất</a-menu-item>
                    </a-menu>
                </template>
            </a-dropdown>
        </div>

        <!-- Xác nhận đăng xuất -->
        <a-modal
            v-model:open="logoutConfirmVisible"
            title="Xác nhận đăng xuất"
            @ok="emit('logout')"
            @cancel="logoutConfirmVisible = false"
            okText="Đăng xuất"
            cancelText="Huỷ"
        >
            <p>Bạn chắc chắn muốn đăng xuất?</p>
        </a-modal>
    </a-layout-header>
</template>


<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/user'
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    LogoutOutlined,
    DownOutlined
} from '@ant-design/icons-vue'

const props = defineProps({
    collapsed: Boolean,
    user: Object
})

const emit = defineEmits(['toggle', 'logout'])

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const currentRoute = useRoute()
const router = useRouter()

const logoutConfirmVisible = ref(false)
const confirmLogout = () => {
    logoutConfirmVisible.value = true
}

const breadcrumbs = computed(() => {
    const matched = []
    let current = router.getRoutes().find(r => r.name === currentRoute.name)

    while (current) {
        if (current.meta?.breadcrumb) {
            matched.unshift(current)
        }
        const parentName = current.meta?.parent
        current = parentName ? router.getRoutes().find(r => r.name === parentName) : null
    }

    return matched
})
</script>
<style scoped>
    .trigger {
        font-size: 18px;
        line-height: 64px;
        padding: 0 24px;
        cursor: pointer;
        transition: color 0.3s;
    }

    .trigger:hover {
        color: #1890ff;
    }
</style>
