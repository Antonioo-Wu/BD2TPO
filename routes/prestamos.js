const express = require('express');
const router = express.Router();
const { estaAutenticado } = require('./auth');
const prestamoController = require('../controllers/prestamoController');


const esAdmin = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).send('Acceso denegado');
    }
};


router.get('/activos', estaAutenticado, prestamoController.getPrestamosActivos);


router.get('/historial', estaAutenticado, prestamoController.getHistorialPrestamos);


router.get('/admin', [estaAutenticado, esAdmin], prestamoController.getTodosPrestamos);


router.get('/reporte', [estaAutenticado, esAdmin], prestamoController.getReporte);

module.exports = router; 