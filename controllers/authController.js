const UsuarioRedis = require('../models/usuarioRedis');

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

        
        const nuevoUsuario = await UsuarioRedis.crear({
            username,
            password,
            rol
        });

        
        req.session.usuario = {
            username: nuevoUsuario.username,
            rol: nuevoUsuario.rol
        };

        
        res.redirect(nuevoUsuario.rol === 'admin' ? '/libros' : '/');

    } catch (error) {
        res.render('auth/registro', { 
            error: error.message || 'Error al crear el usuario' 
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const usuario = await UsuarioRedis.buscarPorUsername(username);
        
        if (!usuario || usuario.password !== password) {
            return res.render('auth/login', { 
                error: 'Usuario o contraseña incorrectos' 
            });
        }

        req.session.usuario = {
            username: usuario.username,
            rol: usuario.rol
        };

        res.redirect(usuario.rol === 'admin' ? '/libros' : '/');

    } catch (error) {
        res.render('auth/login', { 
            error: 'Error al iniciar sesión' 
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/auth/login');
    });
}; 