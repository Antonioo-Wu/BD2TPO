const Redis = require('ioredis');

const redis = new Redis({
    port: 6380,
    host: '127.0.0.1',
    lazyConnect: true
});

class RedisService {
    
    static async guardarSesion(sessionId, datos) {
        await redis.set(`sesion:${sessionId}`, JSON.stringify(datos), 'EX', 86400); 
    }

    static async obtenerSesion(sessionId) {
        const sesion = await redis.get(`sesion:${sessionId}`);
        return sesion ? JSON.parse(sesion) : null;
    }

    static async eliminarSesion(sessionId) {
        await redis.del(`sesion:${sessionId}`);
    }

    
    static async incrementarVisitasLibro(titulo) {
        
        const claveLibro = `libro:${titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')}:visitas`;
        return await redis.incr(claveLibro);
    }

    static async obtenerVisitasLibro(titulo) {
        const claveLibro = `libro:${titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')}:visitas`;
        const visitas = await redis.get(claveLibro);
        return parseInt(visitas) || 0;
    }

    static async obtenerLibroMasVisitado() {
        
        const claves = await redis.keys('libro:*:visitas');
        let libroMasVisitado = null;
        let maxVisitas = 0;

        
        for (const clave of claves) {
            const visitas = parseInt(await redis.get(clave)) || 0;
            if (visitas > maxVisitas) {
                maxVisitas = visitas;
                
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

    
    static async agregarLibroAlHistorial(username, libroData) {
        const timestamp = new Date().toISOString();
        const entrada = {
            ...libroData,
            fechaVisita: timestamp
        };
        
        
        await redis.lpush(`historial:${username}`, JSON.stringify(entrada));
        
        
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