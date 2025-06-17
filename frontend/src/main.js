import './styles/main.css';
import { fetchLastTelemetryData, fetchTelemetryData } from './api/telemetry.js';
import { appendTelemetryPoint, renderTelemetryChart } from './charts/telemetryChart.js';

function toISO(dateStr) {
    if (!dateStr) return null;
    // Ya no necesitamos ajustar la zona horaria porque los datos vienen en UTC
    // Simplemente convertimos el formato
    const clean = dateStr.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1') + 'Z';
    return clean;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Mostrar spinner al inicio
    showLoadingSpinner();
    
    let fullData = await fetchTelemetryData(); // data global
    let filteredData = null; // null = no filtro activo

    renderTelemetryChart(fullData);
    renderCurrentValues(fullData.at(-1));

    // Ocultar spinner después de cargar
    hideLoadingSpinner();

    let lastTimestamp = fullData.at(-1)?.time || null;

    const fromInput = document.getElementById('fromDate');
    const toInput = document.getElementById('toDate');
    const filterBtn = document.getElementById('filterBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const updateBtn = document.getElementById('updateBtn');

    async function aplicarFiltro() {
        // Mostrar spinner al aplicar filtro
        showLoadingSpinner();

        let fromISOString = null;
        let toISOString = null;

        // Solo procesar las fechas si ambos campos tienen valor
        if (fromInput.value && toInput.value) {
            // Crear las fechas
            const from = new Date(fromInput.value);
            const to = new Date(toInput.value);

            // Validar que las fechas sean válidas
            if (isNaN(from.getTime()) || isNaN(to.getTime())) {
                alert('Por favor, seleccione fechas válidas');
                hideLoadingSpinner();
                return;
            }

            // Convertir directamente a ISO string (esto automáticamente convierte a UTC)
            fromISOString = from.toISOString();
            toISOString = to.toISOString();

            console.log('Fechas finales para la API:', {
                fromISOString,
                toISOString
            });
        }

        try {
            // Obtener nuevos datos de la API con el filtro
            const newData = await fetchTelemetryData(fromISOString, toISOString);
            
            if (!newData || newData.length === 0) {
                alert('No se encontraron datos para el período seleccionado');
                hideLoadingSpinner();
                return;
            }

            // Transformar los datos al formato esperado
            filteredData = newData.map(point => ({
                temp1: point.temp1,
                temp2: point.temp2,
                temp3: point.temp3,
                temp4: point.temp4,
                flujo1: point.flujo1,
                time: point.time
            }));

            renderTelemetryChart(filteredData);
            
            // Limpiar los inputs
            fromInput.value = '';
            toInput.value = '';

            // Ocultar spinner después de cargar
            hideLoadingSpinner();
        } catch (error) {
            console.error('Error al obtener datos filtrados:', error);
            alert('Error al obtener los datos filtrados. Por favor, intente nuevamente.');
            hideLoadingSpinner();
        }
    }

    // Función para actualizar los valores
    async function updateValues() {
        const newPoint = await fetchLastTelemetryData();
        console.log("Nuevo punto recibido:", newPoint);
        console.log("Último timestamp:", lastTimestamp);

        if (newPoint) {
            // Transformar el nuevo punto al formato esperado
            const transformedPoint = {
                temp1: newPoint.temp1.value,
                temp2: newPoint.temp2.value,
                temp3: newPoint.temp3.value,
                temp4: newPoint.temp4.value,
                flujo1: newPoint.flujo1.value,
                time: newPoint.temp1.time // Usamos el time de cualquier sensor ya que todos son iguales
            };
            
            if (transformedPoint.time && transformedPoint.time !== lastTimestamp) {
                console.log("🟢 Detectado nuevo punto");
                appendTelemetryPoint(transformedPoint);
                renderCurrentValues(transformedPoint);
                lastTimestamp = transformedPoint.time;
                console.log("🟢 Nuevo punto agregado al gráfico y al historial completo.");
            } else {
                console.log("🔄 Mismo timestamp, no se actualiza.");
            }
        }
    }

    // Funciones para mostrar/ocultar el spinner
    function showLoadingSpinner() {
        document.getElementById('loadingSpinner').style.display = 'flex';
        document.getElementById('loadingSpinnerFlow').style.display = 'flex';
    }

    function hideLoadingSpinner() {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('loadingSpinnerFlow').style.display = 'none';
    }

    filterBtn.addEventListener('click', aplicarFiltro);

    downloadBtn.addEventListener('click', () => {
        downloadCSV(filteredData || fullData);
    });

    // Agregar evento click al botón de actualizar
    updateBtn.addEventListener('click', updateValues);

    // Agregar manejo de pestañas
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos los botones y paneles
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Agregar clase active al botón clickeado
            button.classList.add('active');

            // Mostrar el panel correspondiente
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
});

function downloadCSV(data) {
    // Transformar los datos para ajustar las fechas a UTC-5
    const adjustedData = data.map(point => {
        const date = new Date(point.time);
        date.setHours(date.getHours() - 5);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        return {
            time: formattedDate,
            temp1: point.temp1,
            temp2: point.temp2,
            temp3: point.temp3,
            temp4: point.temp4,
            flujo1: point.flujo1
        };
    });

    // Encabezados personalizados
    const headers = [
        'Fecha y Hora',
        'TSalProducto',
        'TIngRetenedor',
        'TSalAguaCaliente',
        'TSalRetenedor',
        'Flujo'
    ];

    // Generar las filas de datos con los nuevos nombres
    const rows = adjustedData.map(d =>
        [
            d.time,
            d.temp1,
            d.temp2,
            d.temp3,
            d.temp4,
            d.flujo1
        ].join(',')
    );

    const csv = `${headers.join(',')}\n${rows.join('\n')}`;
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
    const temp4 = document.getElementById('temp4_realtime');
    const flujo1 = document.getElementById('flujo1_realtime');

    temp1.textContent = parseFloat(dataPoint.temp1).toFixed(1);
    temp2.textContent = parseFloat(dataPoint.temp2).toFixed(1);
    temp3.textContent = parseFloat(dataPoint.temp3).toFixed(1);
    temp4.textContent = parseFloat(dataPoint.temp4).toFixed(1);
    flujo1.textContent = parseFloat(dataPoint.flujo1).toFixed(1);

    // Actualizar texto del span last-update
    const lastUpdate = document.querySelector('.last-update');

    if (lastUpdate) {
        console.log("Timestamp recibido:", dataPoint.time); // Debug
        const date = new Date(dataPoint.time);
        console.log("Fecha parseada:", date); // Debug
        
        if (!isNaN(date.getTime())) { // Verificar si la fecha es válida
            // Ajustar a UTC-5
            date.setHours(date.getHours() - 5);
            // Formato deseado: "Fri Jun 13 2025 10:11:14"
            const formattedDate = date.toString().split('GMT')[0].trim(); // Remueve la parte de GMT

            lastUpdate.textContent = 'Última actualización: ' + formattedDate;
        } else {
            console.error("Formato de timestamp inválido:", dataPoint.time);
            lastUpdate.textContent = 'Última actualización: Error en formato de fecha';
        }
    }
}