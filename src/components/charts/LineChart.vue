<template>
    <div ref="chartRef" :style="{ width: '100%', height }"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
    datasets: {
        type: Array,
        default: () => [] // [{ name: 'Tổng số lần quét', data: [...] }]
    },
    labels: {
        type: Array,
        default: () => [] // ['Mar 2025', 'Apr 2025', ...]
    },
    height: {
        type: String,
        default: '400px'
    }
})

const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
    if (!chartRef.value) return
    if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value)
    }

    const series = props.datasets.map(ds => ({
        name: ds.name,
        type: 'line',
        data: ds.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { color: ds.color || undefined }
    }))

    chartInstance.setOption({
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
        xAxis: {
            type: 'category',
            data: props.labels,
            boundaryGap: false
        },
        yAxis: { type: 'value' },
        series
    })
}

watch(() => [props.datasets, props.labels], renderChart, { deep: true })
onMounted(renderChart)
onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.dispose()
        chartInstance = null
    }
})
</script>
