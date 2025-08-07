<template>
    <div>
        <h4 style="text-align: center; margin-bottom: 8px">{{ title }}</h4>
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(PieController, ArcElement, Tooltip, Legend)

const props = defineProps({
    title: String,
    data: Array,
    labelField: String
})

const canvas = ref()
let chart

const drawChart = () => {
    if (chart) chart.destroy()

    const labels = props.data.map(item => item[props.labelField] || 'Không rõ')
    const values = props.data.map(item => item.total || 0)

    chart = new Chart(canvas.value, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['#f50', '#2db7f5', '#87d068', '#108ee9', '#1890ff', '#52c41a']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    })
}

onMounted(drawChart)
watch(() => props.data, drawChart, { deep: true })
</script>
