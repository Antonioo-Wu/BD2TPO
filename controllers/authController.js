const Usuario = require('../models/usuario');
const RedisService = require('../services/redisService');

exports.getLoginForm = (req, res) => {
    if (req.session.usuario) {
        return res.redirect(req.session.usuario.rol === 'admin' ? '/libros' : '/');
    }
    res.render('auth/login', { error: null });
};

exports.getRegistroForm = (req, res) => {
    if (req.session.usuario) {
        return res.redirect(req.session.usuario.rol === 'admin' ? '/libros' : '/');
    }
    res.render('auth/registro', { error: null });
};

exports.registro = async (req, res) => {
    try {
        const { username, password, confirmPassword, rol } = req.body;

        if (password !== confirmPassword) {
            return res.render('auth/registro', { 
                error: 'Las contraseñas no coinciden' 
            });
        }

        const nuevoUsuario = await Usuario.create({
            username,
            password, 
            rol
        });

        const datosSession = {
            username: nuevoUsuario.username,
            rol: nuevoUsuario.rol
        };

        req.session.usuario = datosSession;
        await RedisService.guardarSesion(req.sessionID, datosSession);

        res.redirect(nuevoUsuario.rol === 'admin' ? '/libros' : '/');

    } catch (error) {
        let mensajeError = 'Error al crear el usuario';
        if (error.code === 11000) { 
            mensajeError = 'El nombre de usuario ya existe';
        }
        res.render('auth/registro', { error: mensajeError });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const usuario = await Usuario.findOne({ username });
        
        if (!usuario || usuario.password !== password) { 
            return res.render('auth/login', { 
                error: 'Usuario o contraseña incorrectos' 
            });
        }

        const datosSession = {
            username: usuario.username,
            rol: usuario.rol
        };

        req.session.usuario = datosSession;
        await RedisService.guardarSesion(req.sessionID, datosSession);

        res.redirect(usuario.rol === 'admin' ? '/libros' : '/');

    } catch (error) {
        res.render('auth/login', { 
            error: 'Error al iniciar sesión' 
        });
    }
};

exports.logout = async (req, res) => {
    try {
        await RedisService.eliminarSesion(req.sessionID);
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
            }
            res.redirect('/auth/login');
        });
    } catch (error) {
        console.error('Error al eliminar la sesión de Redis:', error);
        res.redirect('/auth/login');
    }
}; 