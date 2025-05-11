import Chart from 'chart.js/auto';

let chartInstance = null;

export function renderTelemetryChart(data) {
    console.log("Data recibida:", data);

    if (!Array.isArray(data)) {
        console.error("Error: los datos no son un array.");
        return;
    }
    const container = document.getElementById('chartContainer');
    container.innerHTML = ''; // Limpia contenido anterior

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
        labels: data.map(item => item.timestamp),
        datasets: [
            {
            label: 'Temperatura 1',
            data: data.map(item => item.temp1),
            backgroundColor: 'rgba(255, 99, 132, 0.5)'
            },
            {
            label: 'Temperatura 2',
            data: data.map(item => item.temp2),
            backgroundColor: 'rgba(99, 109, 255, 0.5)'
            },
            {
            label: 'Temperatura 3',
            data: data.map(item => item.temp3),
            backgroundColor: 'rgba(245, 255, 99, 0.5)'
            },
            {
            label: 'Flujo',
            data: data.map(item => item.flujo),
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }
        ]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Funcion para agregar so 1 punto nuevo
export function appendTelemetryPoint(dataPoint) {
    if (!chartInstance){
        console.warn("chartInstance no inicializado aún.");
        return;
    } 

    chartInstance.data.labels.push(dataPoint.timestamp);

    chartInstance.data.datasets[0].data.push(dataPoint.temp1);
    chartInstance.data.datasets[1].data.push(dataPoint.temp2);
    chartInstance.data.datasets[2].data.push(dataPoint.temp3);
    chartInstance.data.datasets[3].data.push(dataPoint.flujo);

    chartInstance.update();
}