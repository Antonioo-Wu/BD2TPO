const express = require('express');
const router = express.Router();
const { estaAutenticado } = require('./auth');
const carritoController = require('../controllers/carritoController');


router.get('/', estaAutenticado, carritoController.getCarrito);


router.post('/agregar/:libroId', estaAutenticado, carritoController.agregarLibro);


router.delete('/eliminar/:libroId', estaAutenticado, carritoController.eliminarLibro);


router.put('/actualizar/:libroId', estaAutenticado, carritoController.actualizarCantidad);


router.post('/confirmar', estaAutenticado, carritoController.confirmarCarrito);

module.exports = router; 