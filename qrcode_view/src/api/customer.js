import axios from 'axios'

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true // 👈 Giữ session cho login
})

export const getCustomers = (params = {}) => instance.get('/customers', { params })
export const getCustomer = (id) => instance.get(`/customers/${id}`)
export const createCustomer = (data) => instance.post('/customers', data)
export const updateCustomer = (id, data) => instance.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => instance.delete(`/customers/${id}`)



