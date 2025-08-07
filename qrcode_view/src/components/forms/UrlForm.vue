<template>
    <a-form layout="vertical" v-if="form">
        <a-form-item label="Liên kết/URL">
            <a-input v-model:value="form.settings.data" placeholder="https://example.com" />
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
