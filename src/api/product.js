import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true, // 👈 Bắt buộc để giữ session
})

const apiUpload = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL_UPLOAD,
    withCredentials: true, // 👈 Bắt buộc để giữ session
})

export const getProducts = (params) => api.get('/products', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => apiUpload.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)

// ✅ Mới thêm: Update trạng thái sản phẩm
export const updateProductStatus = (id, status) => api.post(`/products/${id}/toggle-status`, status)

export const uploadFile = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiUpload.post('/upload', formData)
}

export const importProducts = (formData) => api.post('/products/import', formData)

