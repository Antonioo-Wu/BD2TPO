const Redis = require('ioredis');

const redis = new Redis({
    port: 6380,
    host: '127.0.0.1',
    lazyConnect: true
});

class UsuarioRedis {
    static async crear(usuario) {
        const { username, password, rol } = usuario;
        
        const existente = await redis.hget('usuarios', username);
        if (existente) {
            throw new Error('El usuario ya existe');
        }

        await redis.hset('usuarios', username, JSON.stringify({
            username,
            password,
            rol,
            fechaCreacion: new Date().toISOString()
        }));

        return { username, rol };
    }

    static async buscarPorUsername(username) {
        const usuario = await redis.hget('usuarios', username);
        return usuario ? JSON.parse(usuario) : null;
    }

    static async listar() {
        const usuarios = await redis.hgetall('usuarios');
        return Object.values(usuarios).map(u => JSON.parse(u));
    }

    static async actualizar(username, datos) {
        const usuario = await this.buscarPorUsername(username);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const usuarioActualizado = { ...usuario, ...datos };
        await redis.hset('usuarios', username, JSON.stringify(usuarioActualizado));
        return usuarioActualizado;
    }

    static async eliminar(username) {
        return await redis.hdel('usuarios', username);
    }
}

module.exports = UsuarioRedis; 