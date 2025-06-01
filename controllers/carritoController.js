const Carrito = require('../models/carrito');
const Libro = require('../models/libro');
const prestamoController = require('./prestamoController');


exports.getCarrito = async (req, res) => {
    try {
        let carrito = await Carrito.findOne({ usuario: req.session.usuario.username })
                                  .populate('items.libro');
        if (!carrito) {
            carrito = { items: [] };
        }
        res.render('carrito/index', { carrito });
    } catch (error) {
        res.status(500).send('Error al obtener el carrito');
    }
};


exports.agregarLibro = async (req, res) => {
    try {
        const libro = await Libro.findById(req.params.libroId);
        if (!libro) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        
        if (libro.cantidad <= 0) {
            return res.status(400).json({ error: 'Libro no disponible' });
        }

        let carrito = await Carrito.findOne({ usuario: req.session.usuario.username });
        
        if (!carrito) {
            carrito = new Carrito({
                usuario: req.session.usuario.username,
                items: []
            });
        }

        const itemExistente = carrito.items.find(item => 
            item.libro.toString() === req.params.libroId
        );

        if (itemExistente) {
            return res.status(400).json({ error: 'El libro ya está en el carrito' });
        } else {
            carrito.items.push({
                libro: req.params.libroId,
                cantidad: 1 
            });
        }

        await carrito.save();
        res.json({ mensaje: 'Libro agregado al carrito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar al carrito' });
    }
};


exports.confirmarCarrito = async (req, res) => {
    try {
        const carrito = await Carrito.findOne({ usuario: req.session.usuario.username })
                                    .populate('items.libro');
        
        if (!carrito || carrito.items.length === 0) {
            return res.status(400).json({ error: 'Carrito vacío' });
        }

        
        for (const item of carrito.items) {
            const libro = item.libro;
            if (libro.cantidad < item.cantidad) {
                return res.status(400).json({ 
                    error: `No hay suficientes unidades disponibles de "${libro.titulo}"` 
                });
            }
            
            
            libro.cantidad -= item.cantidad;
            await libro.save();

            
            await prestamoController.crearPrestamo(req.session.usuario.username, libro, item.cantidad);
        }

        
        carrito.items = [];
        await carrito.save();

        res.json({ mensaje: 'Préstamos confirmados exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al confirmar el carrito' });
    }
};


exports.eliminarLibro = async (req, res) => {
    try {
        const carrito = await Carrito.findOne({ usuario: req.session.usuario.username });
        if (!carrito) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        carrito.items = carrito.items.filter(item => 
            item.libro.toString() !== req.params.libroId
        );

        await carrito.save();
        res.json({ mensaje: 'Libro eliminado del carrito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar del carrito' });
    }
};


exports.actualizarCantidad = async (req, res) => {
    try {
        const { cantidad } = req.body;
        const carrito = await Carrito.findOne({ usuario: req.session.usuario.username });
        
        if (!carrito) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        const item = carrito.items.find(item => 
            item.libro.toString() === req.params.libroId
        );

        if (!item) {
            return res.status(404).json({ error: 'Libro no encontrado en el carrito' });
        }

        item.cantidad = cantidad;
        if (item.cantidad <= 0) {
            carrito.items = carrito.items.filter(item => 
                item.libro.toString() !== req.params.libroId
            );
        }

        await carrito.save();
        res.json({ mensaje: 'Carrito actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el carrito' });
    }
}; 