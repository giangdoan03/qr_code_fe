<template>
    <div class="dashboard">
        <!-- Cards -->
        <a-row :gutter="[16, 16]" class="card-row">
            <a-col
                v-for="card in cards"
                :key="card.title"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                :xl="4"
            >
                <a-card :bordered="false" class="card" :class="card.class">
                    <div class="card-content">
                        <div class="card-icon"><component :is="card.icon" /></div>
                        <div class="card-value">{{ card.value }}</div>
                        <div class="card-title">{{ card.title }}</div>
                    </div>
                </a-card>
            </a-col>
        </a-row>

        <!-- Charts -->
        <!-- Charts -->
        <div class="charts mt-4">
            <a-row :gutter="[16, 16]">
                <a-col :xs="24" :md="12">
                    <a-card title="Phân bố quốc gia" :bordered="false" class="chart-card">
                        <PieChart style="height: 350px;" :data="scanSummary.by_country" labelField="country" />
                    </a-card>
                </a-col>
                <a-col :xs="24" :md="12">
                    <a-card title="Tổng số lần quét">
                        <LineChart
                            :labels="['Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025']"
                            :datasets="[
                              { name: 'Tổng số lần quét', data: [0, 18, 82, 0], color: '#52c41a' },
                              { name: 'Tổng số thiết bị đã quét', data: [0, 2, 4, 0], color: '#1890ff' }
                            ]"
                                                />
                    </a-card>
                </a-col>

                <a-col :xs="24" :md="12">
                    <a-card title="Thiết bị truy cập" :bordered="false" class="chart-card">
                        <BarChart :data="scanSummary.by_device" labelField="device_type" color="#1890ff" />
                    </a-card>
                </a-col>
                <a-col :xs="24" :md="12">
                    <a-card title="Trình duyệt" :bordered="false" class="chart-card">
                        <BarChart :data="scanSummary.by_browser" labelField="browser" color="#52c41a" />
                    </a-card>
                </a-col>
            </a-row>
        </div>

    </div>
</template>

<script setup>
import {
    AppstoreOutlined, InboxOutlined, BankOutlined,
    QrcodeOutlined, GiftOutlined, FormOutlined
} from '@ant-design/icons-vue'
import { ref, onMounted, computed } from 'vue'
import { getStatistics } from '@/api/statistics'
import { getScanSummary } from '@/api/scanHistory'
import PieChart from '@/components/charts/PieChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'

const stats = ref({
    packages: 0, products: 0, businesses: 0,
    qrcodes: 0, free_qrcodes: 0, surveys: 0
})

const scanSummary = ref({
    by_country: [],
    by_city: [],
    by_device: [],
    by_browser: []
})

const fetchStats = async () => {
    try {
        const res = await getStatistics()
        stats.value = res.data
    } catch (e) {
        console.error('Lỗi thống kê:', e)
    }
}

const fetchScanCharts = async () => {
    try {
        const res = await getScanSummary()
        scanSummary.value = res.data
    } catch (e) {
        console.error('Lỗi thống kê quét mã:', e)
    }
}

onMounted(() => {
    fetchStats()
    fetchScanCharts()
})

const cards = computed(() => [
    { title: 'GÓI DỊCH VỤ', value: stats.value.packages, icon: AppstoreOutlined, class: 'service' },
    { title: 'SẢN PHẨM', value: stats.value.products, icon: InboxOutlined, class: 'product' },
    { title: 'DOANH NGHIỆP', value: stats.value.businesses, icon: BankOutlined, class: 'company' },
    { title: 'QR CODE', value: stats.value.qrcodes, icon: QrcodeOutlined, class: 'qr-code' },
    { title: 'QR CODE MIỄN PHÍ', value: stats.value.free_qrcodes, icon: GiftOutlined, class: 'free-qr-code' },
    { title: 'KHẢO SÁT', value: stats.value.surveys, icon: FormOutlined, class: 'survey' }
])
</script>

<style scoped>
.dashboard {
    padding: 24px;
}
.mt-4 {
    margin-top: 32px;
}
.card {
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    text-align: center;
    padding: 24px 16px;
}
.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
.card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.card-icon {
    font-size: 48px;
    color: #1890ff;
    margin-bottom: 12px;
}
.card-value {
    font-size: 22px;
    font-weight: bold;
    line-height: 1.2;
    margin-bottom: 6px;
}
.card-title {
    font-size: 14px;
    color: #888;
}
.card :deep(.ant-card-body) {
    padding: 12px;
}
</style>
