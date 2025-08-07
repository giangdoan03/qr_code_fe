<template>
    <a-layout style="min-height: 100vh;">
        <Sidebar
            :collapsed="collapsed"
            :selectedKeys="selectedKeys"
            @update:collapsed="collapsed = $event"
            @update:selectedKeys="selectedKeys = $event"
        />
        <a-layout>
            <Header
                :collapsed="collapsed"
                :user="userStore.user"
                @toggle="toggleCollapsed"
                @logout="handleLogout"
            />
            <Content />
        </a-layout>
    </a-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/user'
import { logout } from '../api/auth'

import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Content from './Content.vue'

let collapsed = ref(false)
const selectedKeys = ref(['1'])
const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const router = useRouter()

const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
}

const handleLogout = async () => {
    try {
        await logout()
        userStore.clearUser()
        localStorage.removeItem('role_id')
        await router.push('/login')
    } catch (error) {
        console.error('Logout error:', error)
    }
}
</script>

<style>
.bg_card_gray {
    background: #f3f4f5;
}
</style>
