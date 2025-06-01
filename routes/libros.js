const express = require('express');
const router = express.Router();
const { estaAutenticado, esAdmin } = require('./auth');
const libroController = require('../controllers/libroController');


router.get('/', estaAutenticado, libroController.getAllLibros);


router.get('/nuevo', esAdmin, libroController.getNuevoLibroForm);


router.post('/', esAdmin, libroController.createLibro);


router.get('/:id', estaAutenticado, libroController.getLibroDetalle);


router.get('/editar/:id', esAdmin, libroController.getEditarLibroForm);


router.put('/:id', esAdmin, libroController.updateLibro);


router.delete('/:id', esAdmin, libroController.deleteLibro);

module.exports = router; 