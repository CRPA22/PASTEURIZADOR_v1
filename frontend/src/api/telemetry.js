const API_BASE_URL = 'https://nommlf6gjd.execute-api.us-east-1.amazonaws.com/deploy/api';
const LAST_VALUES_URL = `${API_BASE_URL}/last_values`;
const VALUES_URL = `${API_BASE_URL}/values`;

export async function fetchTelemetryData(fromDate = null, toDate = null) {
    try {
        const params = new URLSearchParams();
        
        if (fromDate) {
            params.append('from', fromDate);
        }
        if (toDate) {
            params.append('to', toDate);
        }

        //console.log(`${VALUES_URL}?${params}`);

        const response = await fetch(`${VALUES_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Respuesta API:", data);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error al obtener datos de la API:', error);
        return [];
    }
}

export async function fetchLastTelemetryData() {
    try {
        const response = await fetch(LAST_VALUES_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("LastData:", data);
        return data;
    } catch (error) {
        console.error('Error al obtener último dato de la API:', error);
        return null;
    }
}