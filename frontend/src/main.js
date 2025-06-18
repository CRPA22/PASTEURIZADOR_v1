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
    // Variables globales
    let fullData = null; // data global - se cargará solo cuando sea necesario
    let filteredData = null; // null = no filtro activo
    let lastTimestamp = null;
    let chartInitialized = false; // Flag para saber si el gráfico ya fue inicializado

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
            // Obtener datos de la API (con filtro o todos los datos si no hay filtro)
            const newData = await fetchTelemetryData(fromISOString, toISOString);
            
            if (!newData || newData.length === 0) {
                alert('No se encontraron datos para el período seleccionado');
                hideLoadingSpinner();
                return;
            }

            // Transformar los datos al formato esperado
            const transformedData = newData.map(point => ({
                temp1: point.temp1,
                temp2: point.temp2,
                temp3: point.temp3,
                temp4: point.temp4,
                flujo1: point.flujo1,
                time: point.time
            }));

            // Guardar los datos según si es filtro o datos completos
            if (fromISOString && toISOString) {
                filteredData = transformedData;
            } else {
                fullData = transformedData;
            }

            // SÍ renderizar el gráfico cuando se aplica filtro
            renderTelemetryChart(transformedData);
            renderCurrentValues(transformedData.at(-1));
            
            // Actualizar el último timestamp
            lastTimestamp = transformedData.at(-1)?.time || null;
            chartInitialized = true;

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

    // Función para cargar datos iniciales si no existen
    async function loadInitialDataIfNeeded() {
        if (!chartInitialized) {
            console.log("Cargando datos iniciales...");
            showLoadingSpinner();
            
            try {
                // Cargar todos los datos históricos
                const initialData = await fetchTelemetryData();
                
                if (!initialData || initialData.length === 0) {
                    alert('No se pudieron cargar los datos iniciales');
                    hideLoadingSpinner();
                    return false;
                }

                // Transformar los datos al formato esperado
                fullData = initialData.map(point => ({
                    temp1: point.temp1,
                    temp2: point.temp2,
                    temp3: point.temp3,
                    temp4: point.temp4,
                    flujo1: point.flujo1,
                    time: point.time
                }));

                // NO renderizar el gráfico, solo guardar los datos
                // renderTelemetryChart(fullData); // <- COMENTAR ESTA LÍNEA
                // renderCurrentValues(fullData.at(-1)); // <- COMENTAR ESTA LÍNEA
                
                // Actualizar el último timestamp
                lastTimestamp = fullData.at(-1)?.time || null;
                chartInitialized = true;
                
                hideLoadingSpinner();
                console.log("Datos iniciales cargados correctamente (sin gráfico)");
                return true;
            } catch (error) {
                console.error('Error al cargar datos iniciales:', error);
                alert('Error al cargar los datos iniciales. Por favor, intente nuevamente.');
                hideLoadingSpinner();
                return false;
            }
        }
        return true;
    }

    // Función para actualizar los valores
    async function updateValues() {
        // Mostrar spinner mientras se obtienen los datos
        showLoadingSpinner();

        try {
            const newPoint = await fetchLastTelemetryData();
            console.log("Nuevo punto recibido:", newPoint);

            if (newPoint) {
                // Transformar el nuevo punto al formato esperado
                const transformedPoint = {
                    temp1: newPoint.temp1.value,
                    temp2: newPoint.temp2.value,
                    temp3: newPoint.temp3.value,
                    temp4: newPoint.temp4.value,
                    flujo1: newPoint.flujo1.value,
                    time: newPoint.temp1.time
                };
                
                // SOLO actualizar las tarjetas de valores actuales
                renderCurrentValues(transformedPoint);
                
                console.log("🟢 Valores actualizados en las tarjetas.");
            } else {
                console.log("No se pudieron obtener datos actuales.");
            }
        } catch (error) {
            console.error('Error al obtener datos actuales:', error);
            alert('Error al obtener los datos actuales. Por favor, intente nuevamente.');
        } finally {
            // Ocultar spinner
            hideLoadingSpinner();
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

    downloadBtn.addEventListener('click', async () => {
        // Verificar si hay datos para descargar
        if (!fullData && !filteredData) {
            alert('No hay datos para descargar. Aplique un filtro primero para cargar datos.');
            return;
        }
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
            
            // Formato deseado: "Fri Jun 13 2025 10:11"
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) + ' ' + date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            lastUpdate.textContent = 'Última actualización: ' + formattedDate;
        } else {
            console.error("Formato de timestamp inválido:", dataPoint.time);
            lastUpdate.textContent = 'Última actualización: Error en formato de fecha';
        }
    }
}