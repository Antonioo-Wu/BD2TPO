const Redis = require('ioredis');

const redis = new Redis({
    port: 6380,
    host: '127.0.0.1',
    lazyConnect: true
});

class RedisService {
    // Manejo de sesiones
    static async guardarSesion(sessionId, datos) {
        await redis.set(`sesion:${sessionId}`, JSON.stringify(datos), 'EX', 86400); // 24 horas
    }

    static async obtenerSesion(sessionId) {
        const sesion = await redis.get(`sesion:${sessionId}`);
        return sesion ? JSON.parse(sesion) : null;
    }

    static async eliminarSesion(sessionId) {
        await redis.del(`sesion:${sessionId}`);
    }

    // Contadores globales de visitas de libros
    static async incrementarVisitasLibro(titulo) {
        // Normalizar el título para usarlo como clave
        const claveLibro = `libro:${titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')}:visitas`;
        return await redis.incr(claveLibro);
    }

    static async obtenerVisitasLibro(titulo) {
        const claveLibro = `libro:${titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')}:visitas`;
        const visitas = await redis.get(claveLibro);
        return parseInt(visitas) || 0;
    }

    static async obtenerLibroMasVisitado() {
        // Obtener todas las claves que coincidan con el patrón de visitas de libros
        const claves = await redis.keys('libro:*:visitas');
        let libroMasVisitado = null;
        let maxVisitas = 0;

        // Iterar sobre todas las claves para encontrar el libro con más visitas
        for (const clave of claves) {
            const visitas = parseInt(await redis.get(clave)) || 0;
            if (visitas > maxVisitas) {
                maxVisitas = visitas;
                // Extraer el título del libro de la clave (libro:titulo:visitas)
                libroMasVisitado = clave.split(':')[1].replace(/_/g, ' ');
            }
        }

        return {
            titulo: libroMasVisitado,
            visitas: maxVisitas
        };
    }

    static async obtenerTotalVisitasLibros() {
        const keys = await redis.keys('libro:*:visitas');
        const visitas = await Promise.all(
            keys.map(async (key) => {
                const count = await redis.get(key);
                // Extraer el título del libro de la clave
                const tituloNormalizado = key.split(':')[1];
                const titulo = tituloNormalizado.replace(/_/g, ' ');
                return {
                    titulo,
                    visitas: parseInt(count) || 0
                };
            })
        );
        return visitas;
    }

    // Historial de libros visitados
    static async agregarLibroAlHistorial(username, libroData) {
        const timestamp = new Date().toISOString();
        const entrada = {
            ...libroData,
            fechaVisita: timestamp
        };
        
        // Agregar al inicio de la lista
        await redis.lpush(`historial:${username}`, JSON.stringify(entrada));
        
        // Mantener solo los últimos 50 libros visitados
        await redis.ltrim(`historial:${username}`, 0, 49);
    }

    static async obtenerHistorialUsuario(username) {
        const historial = await redis.lrange(`historial:${username}`, 0, -1);
        return historial.map(entrada => JSON.parse(entrada));
    }

    static async limpiarHistorialUsuario(username) {
        await redis.del(`historial:${username}`);
    }
}

module.exports = RedisService; 