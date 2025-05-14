import './styles/main.css';
import { fetchLastTelemetryData, fetchTelemetryData } from './api/telemetry.js';
import { appendTelemetryPoint, renderTelemetryChart } from './charts/telemetryChart.js';



document.addEventListener('DOMContentLoaded', async () => {
    let fullData = await fetchTelemetryData(); // data global
    let filteredData = null; // null = no filtro activo

    renderTelemetryChart(fullData);
    renderCurrentValues(fullData.at(-1));

    let lastTimestamp = fullData.at(-1)?.timestamp || null;

    const fromInput = document.getElementById('fromDate');
    const toInput = document.getElementById('toDate');
    const filterBtn = document.getElementById('filterBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    function aplicarFiltro() {
        const from = new Date(fromInput.value);
        const to = new Date(toInput.value);

        const result = fullData.filter(d => {
        const t = new Date(d.timestamp);
        return (!isNaN(from) ? t >= from : true) && (!isNaN(to) ? t <= to : true);
        });

        filteredData = result;
        renderTelemetryChart(filteredData);

        fromInput.value = '';
        toInput.value = '';
    
    }

    filterBtn.addEventListener('click', aplicarFiltro);

    downloadBtn.addEventListener('click', () => {
        downloadCSV(filteredData || fullData);
    });

    // Actualización automática cada 1 segundos
    setInterval(async () => {
        const newPoint = await fetchLastTelemetryData();
        console.log("Nuevo punto recibido:", newPoint);

        if (newPoint.timestamp !== lastTimestamp) {
        appendTelemetryPoint(newPoint);
        renderCurrentValues(newPoint);
        lastTimestamp = newPoint.timestamp;
        console.log("🟢 Nuevo punto agregado al gráfico.");
        } else {
        console.log("🔄 Mismo timestamp, no se actualiza.");
        }
    }, 1000); // cada 1 segundos
});

function downloadCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(d => Object.values(d).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telemetria.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function renderCurrentValues(dataPoint) {
    
    const temp1 = document.getElementById('temp1_realtime');
    const temp2 = document.getElementById('temp2_realtime');
    const temp3 = document.getElementById('temp3_realtime');
    const flujo = document.getElementById('flujo_realtime');

    temp1.textContent = dataPoint.temp1.toFixed(1);
    temp2.textContent = dataPoint.temp2.toFixed(1);
    temp3.textContent = dataPoint.temp3.toFixed(1);
    flujo.textContent = dataPoint.flujo.toFixed(1);

    // Actualizar texto del span last-update
    const lastUpdate = document.querySelector('.last-update');

    if (lastUpdate) {
        const date = new Date(dataPoint.timestamp);
        lastUpdate.textContent = 'Última actualización: ' + date.toLocaleTimeString();
    }
}