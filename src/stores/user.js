import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: {
            id: null,
            email: '',
            name: '',
            role: '',
            role_id: null,
            avatar: null
        }
    }),
    actions: {
        setUser(user) {
            this.user = { ...this.user, ...user } // 👈 đảm bảo reactive
        },
        clearUser() {
            this.user = {
                id: null,
                email: '',
                name: '',
                role: '',
                role_id: null,
                avatar: null
            }
        }
    }
})

