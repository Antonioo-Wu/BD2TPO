const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


const usuarios = {
  admin: { password: 'admin123', rol: 'admin' },
  usuario: { password: 'usuario123', rol: 'usuario' }
};


const estaAutenticado = (req, res, next) => {
  if (req.session.usuario) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};


const esAdmin = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.rol === 'admin') {
    next();
  } else {
    res.status(403).send('Acceso denegado');
  }
};


router.get('/login', authController.getLoginForm);
router.post('/login', authController.login);


router.get('/registro', authController.getRegistroForm);
router.post('/registro', authController.registro);


router.get('/logout', authController.logout);


module.exports = router;
module.exports.estaAutenticado = estaAutenticado;
module.exports.esAdmin = esAdmin; 