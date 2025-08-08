<template>
    <a-form layout="vertical">
        <a-form-item label="Nội dung văn bản">
            <a-textarea
                v-model:value="form.settings.data"
                :rows="4"
                placeholder="Nhập nội dung văn bản..."
            />
        </a-form-item>
        <a-form-item label="Tên QR (tuỳ chọn)">
            <a-input v-model:value="form.qr_name" placeholder="Nhập tên cho QR của bạn" />
        </a-form-item>
    </a-form>
</template>

<script setup>
const form = defineModel()
defineExpose({
    requireTarget: false,
})
</script>
