<template>
    <div>
        <h4 style="text-align: center; margin-bottom: 8px">{{ title }}</h4>
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
    title: String,
    data: Array,
    labelField: String,
    color: { type: String, default: '#1890ff' }
})

const canvas = ref()
let chart

const drawChart = () => {
    if (chart) chart.destroy()

    const labels = props.data.map(item => item[props.labelField] || 'Không rõ')
    const values = props.data.map(item => item.total || 0)

    chart = new Chart(canvas.value, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: props.title,
                data: values,
                backgroundColor: props.color
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { beginAtZero: true },
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    })
}

onMounted(drawChart)
watch(() => props.data, drawChart, { deep: true })
</script>
