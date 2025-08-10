// src/api/upload.js
import axios from 'axios'

const apiUpload = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL_UPLOAD || import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    timeout: 60000, // giúp tránh treo vô hạn
})

// (khuyến nghị) gỡ cache CORS trên vài proxy
apiUpload.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

// Log baseURL để chắc chắn đang trỏ đúng môi trường
if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[upload] baseURL =', apiUpload.defaults.baseURL)
}

// Chuẩn hóa lỗi để UI hiển thị dễ hiểu
function toFriendlyError(err) {
    if (err.response) {
        const { status, data } = err.response
        // Một vài mapping hay gặp
        if (status === 401) return { status, message: 'Unauthorized (401) — kiểm tra WP_USER / APP_PASSWORD ở API.' }
        if (status === 403) return { status, message: 'Forbidden (403) — CORS/ quyền không đủ.' }
        if (status === 413) return { status, message: 'File quá lớn (413) — tăng UPLOAD_MAX_BYTES & client limit.' }
        if (status === 415) return { status, message: 'Unsupported media type (415) — MIME chưa cho phép.' }
        return { status, message: data?.message || `Lỗi server (${status})`, data }
    } else if (err.request) {
        // Không nhận được response: thường là CORS/preflight hoặc DNS/HTTPS
        return { status: 0, message: 'Network Error — kiểm tra CORS, host/port, hoặc HTTPS.' }
    }
    return { status: 0, message: err.message || 'Unknown error' }
}

/**
 * Upload 1 file
 */
export function uploadMedia(file, meta = {}, onProgress) {
    const fd = new FormData()
    fd.append('file', file)
    Object.entries(meta).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') fd.append(k, v)
    })

    return apiUpload.post('/upload', fd, {
        onUploadProgress: e => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
    })
        .then(r => r.data)
        .catch(err => { throw toFriendlyError(err) })
}

/**
 * Upload từ URL
 */
export function uploadFromUrl(url, meta = {}) {
    return apiUpload.post('/upload-from-url', { url, ...meta })
        .then(r => r.data)
        .catch(err => { throw toFriendlyError(err) })
}

/**
 * Upload nhiều file (tuần tự)
 */
export async function uploadMany(files, meta = {}, listeners = {}) {
    const out = []
    for (let i = 0; i < files.length; i++) {
        const m = typeof meta === 'function' ? (meta(files[i], i) || {}) : meta
        try {
            // eslint-disable-next-line no-await-in-loop
            const res = await uploadMedia(files[i], m, pct => listeners.onEachProgress?.(i, pct))
            listeners.onEachDone?.(i, res)
            out.push(res)
        } catch (e) {
            // Báo lỗi từng file, nhưng không dừng toàn bộ
            listeners.onEachDone?.(i, { error: e })
            out.push({ error: e })
        }
    }
    return out
}
