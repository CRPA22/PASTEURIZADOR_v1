import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';

// Registrar el plugin de zoom
Chart.register(zoomPlugin);

let temperatureChartInstance = null;
let flowChartInstance = null;

export function renderTelemetryChart(data) {
    console.log("Data recibida:", data);

    if (!Array.isArray(data)) {
        console.error("Error: los datos no son un array.");
        return;
    }

    // Configuración común para las etiquetas de tiempo
    const timeLabels = data.map(item => {
        const date = new Date(item.time);
        date.setHours(date.getHours() - 5); // Ajustar a UTC-5
        return date.toLocaleTimeString();
    });

    // Configuración común para las opciones
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: {
            padding: {
                bottom: 20
            }
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    mode: 'x',
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
            legend: {
                position: 'top',
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Tiempo'
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Valor'
                },
                beginAtZero: false,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false
        }
    };

    // Configuración común para los datasets
    const commonDatasetConfig = {
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
        tension: 0.4
    };

    // Renderizar gráfico de temperaturas
    const tempContainer = document.getElementById('temperatureChart').getContext('2d');
    if (temperatureChartInstance) {
        temperatureChartInstance.destroy();
    }

    temperatureChartInstance = new Chart(tempContainer, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'TSalProducto',
                    data: data.map(item => item.temp1),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    ...commonDatasetConfig
                },
                {
                    label: 'TIngRetenedor',
                    data: data.map(item => item.temp2),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    ...commonDatasetConfig
                },
                {
                    label: 'TSalAguaCaliente',
                    data: data.map(item => item.temp3),
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    ...commonDatasetConfig
                },
                {
                    label: 'TSalRetenedor',
                    data: data.map(item => item.temp4),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    ...commonDatasetConfig
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    }
                }
            }
        }
    });

    // Renderizar gráfico de flujo
    const flowContainer = document.getElementById('flowChart').getContext('2d');
    if (flowChartInstance) {
        flowChartInstance.destroy();
    }

    flowChartInstance = new Chart(flowContainer, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Flujo',
                    data: data.map(item => item.flujo1),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    ...commonDatasetConfig
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Flujo (L/min)'
                    }
                }
            }
        }
    });
}

// Función para exportar datos del gráfico
function exportChartData(chart) {
    const data = chart.data.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
        + "Tiempo," + data.map(d => d.label).join(",") + "\n"
        + chart.data.labels.map((label, i) => 
            label + "," + data.map(d => d.data[i]).join(",")
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "datos_grafico.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Función para agregar un punto nuevo
export function appendTelemetryPoint(dataPoint) {
    if (!temperatureChartInstance || !flowChartInstance) {
        console.warn("Los gráficos no están inicializados aún.");
        return;
    }

    const date = new Date(dataPoint.time);
    date.setHours(date.getHours() - 5); // Ajustar a UTC-5
    const timeLabel = date.toLocaleTimeString();

    // Actualizar gráfico de temperaturas
    temperatureChartInstance.data.labels.push(timeLabel);
    temperatureChartInstance.data.datasets[0].data.push(dataPoint.temp1);
    temperatureChartInstance.data.datasets[1].data.push(dataPoint.temp2);
    temperatureChartInstance.data.datasets[2].data.push(dataPoint.temp3);
    temperatureChartInstance.data.datasets[3].data.push(dataPoint.temp4);
    temperatureChartInstance.update();

    // Actualizar gráfico de flujo
    flowChartInstance.data.labels.push(timeLabel);
    flowChartInstance.data.datasets[0].data.push(dataPoint.flujo1);
    flowChartInstance.update();
}