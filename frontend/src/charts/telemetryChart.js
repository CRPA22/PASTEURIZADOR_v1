import Chart from 'chart.js/auto';

let chartInstance = null;

export function renderTelemetryChart(data) {
    console.log("Data recibida:", data);

    if (!Array.isArray(data)) {
        console.error("Error: los datos no son un array.");
        return;
    }
    const container = document.getElementById('chartContainer').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(container, {
        type: 'line',
        data: {
        labels: data.map(item => item.timestamp),
        datasets: [
            {
                label: 'Temperatura 1',
                data: data.map(item => item.temp1),
                backgroundColor: 'rgba(255, 99, 132, 0.2)', // Rojo transparente
                borderColor: 'rgba(255, 99, 132, 1)', // Rojo
                borderWidth: 2
            },
            {
                label: 'Temperatura 2',
                data: data.map(item => item.temp2),
                backgroundColor: 'rgba(54, 162, 235, 0.2)', // Azul transparente
                borderColor: 'rgba(54, 162, 235, 1)', // Azul
                borderWidth: 2
            },
            {
                label: 'Temperatura 3',
                data: data.map(item => item.temp3),
                backgroundColor: 'rgba(255, 206, 86, 0.2)', // Amarillo transparente
                borderColor: 'rgba(255, 206, 86, 1)', // Amarillo
                borderWidth: 2
            },
            {
                label: 'Flujo',
                data: data.map(item => item.flujo),
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Verde transparente
                borderColor: 'rgba(75, 192, 192, 1)', // Verde
                borderWidth: 2
            }
        ]
        },
        options: {
            responsive: true, // Gráfico responsivo
            maintainAspectRatio: false, // No mantener relación de aspecto
            animation: false,
            scales: {
                // Configuración del eje X (tiempo)
                x: {
                    title: {
                        display: true,
                        text: 'Tiempo'
                    }
                },
                // Configuración del eje Y principal (temperaturas)
                y: {
                    title: {
                        display: true,
                        text: 'Mensurandos'
                    },
                    beginAtZero: false // El eje no empieza en cero
                },
            },
            interaction: {
                mode: 'index', // Mostrar todos los valores para un mismo punto en el tiempo
                intersect: false, // No requerir que el cursor esté exactamente sobre el punto
            },
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