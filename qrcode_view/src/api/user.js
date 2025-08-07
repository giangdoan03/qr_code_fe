import axios from 'axios'

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
})

export const getUsers = (params = {}) => instance.get('/users', { params })
export const getUser = (id) => instance.get(`/users/${id}`)


export const createUser = (data) => {
    const formData = new FormData()
    for (const key in data) {
        formData.append(key, data[key])
    }
    return instance.post('/users', formData)
}
export const updateUser = (id, data) => {
    const formData = new FormData()
    for (const key in data) {
        formData.append(key, data[key])
    }
    // Gửi POST tới /users/update/{id}
    return instance.post(`/users/update/${id}`, formData)
}


export const deleteUserById = (id) => instance.delete(`/users/${id}`)

export const uploadFile = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return instance.post('/upload', formData)
}

export const changePasswordAPI = (data) => instance.post('/users/change-password', data)

export const getCurrentUser = () => instance.get('/me')



