export async function fetchTelemetryData() {
    try {
        const response = await fetch('/api/all');
        const data = await response.json();
        // Verifica tipo de dato recibido
        console.log("Respuesta API:", data);

        return Array.isArray(data) ? data : [];
        //return data;
    } catch (error) {
        console.error('Error al obtener datos de la API:', error);
        return [];
    }
}

export async function fetchLastTelemetryData() {
    const response = await fetch('/api/last');
    console.log("LastData:", response);

    return await response.json();
}
