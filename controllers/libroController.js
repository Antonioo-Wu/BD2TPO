const Libro = require('../models/libro');
const RedisService = require('../services/redisService');


exports.getAllLibros = async (req, res) => {
    try {
        const { busqueda, ordenar } = req.query;
        let query = {};
        
        
        if (busqueda) {
            query = {
                $or: [
                    { titulo: { $regex: busqueda, $options: 'i' } },
                    { autor: { $regex: busqueda, $options: 'i' } },
                    { isbn: { $regex: busqueda, $options: 'i' } },
                    { descripcion: { $regex: busqueda, $options: 'i' } }
                ]
            };
        }

        
        let librosQuery = Libro.find(query);

        
        if (ordenar) {
            switch (ordenar) {
                case 'titulo_asc':
                    librosQuery = librosQuery.sort({ titulo: 1 });
                    break;
                case 'titulo_desc':
                    librosQuery = librosQuery.sort({ titulo: -1 });
                    break;
                case 'autor_asc':
                    librosQuery = librosQuery.sort({ autor: 1 });
                    break;
                case 'autor_desc':
                    librosQuery = librosQuery.sort({ autor: -1 });
                    break;
                case 'fecha_asc':
                    librosQuery = librosQuery.sort({ fechaPublicacion: 1 });
                    break;
                case 'fecha_desc':
                    librosQuery = librosQuery.sort({ fechaPublicacion: -1 });
                    break;
            }
        }

        const [libros, libroMasVisitado] = await Promise.all([
            librosQuery,
            RedisService.obtenerLibroMasVisitado()
        ]);

        res.render('libros/index', { 
            libros, 
            busqueda: busqueda || '',
            ordenar: ordenar || '',
            libroMasVisitado
        });
    } catch (error) {
        res.status(500).send('Error al obtener los libros');
    }
};


exports.getNuevoLibroForm = async (req, res) => {
    try {
        res.render('libros/nuevo');
    } catch (error) {
        res.status(500).send('Error al cargar el formulario');
    }
};


exports.createLibro = async (req, res) => {
    try {
        const libroData = {
            titulo: req.body.titulo,
            autor: req.body.autor,
            isbn: req.body.isbn,
            cantidad: parseInt(req.body.cantidad) || 1,
            descripcion: req.body.descripcion,
            fechaPublicacion: req.body.fechaPublicacion || null
        };

        const libro = new Libro(libroData);
        await libro.save();
        res.redirect('/libros');
    } catch (error) {
        res.render('libros/nuevo', {
            error: 'Error al crear el libro. ' + (error.code === 11000 ? 'El ISBN ya existe.' : error.message)
        });
    }
};


exports.getEditarLibroForm = async (req, res) => {
    try {
        const libro = await Libro.findById(req.params.id);

        if (!libro) {
            return res.status(404).send('Libro no encontrado');
        }

        res.render('libros/editar', { libro });
    } catch (error) {
        res.status(500).send('Error al cargar el formulario de edición');
    }
};


exports.updateLibro = async (req, res) => {
    try {
        const actualizacion = {
            titulo: req.body.titulo,
            autor: req.body.autor,
            isbn: req.body.isbn,
            cantidad: parseInt(req.body.cantidad),
            descripcion: req.body.descripcion,
            fechaPublicacion: req.body.fechaPublicacion || null
        };

        const libro = await Libro.findByIdAndUpdate(
            req.params.id,
            actualizacion,
            { new: true, runValidators: true }
        );
        
        if (!libro) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }
        
        res.json({ mensaje: 'Libro actualizado con éxito', libro });
    } catch (error) {
        res.status(400).json({ 
            error: 'Error al actualizar el libro: ' + error.message,
            detalles: error
        });
    }
};


exports.deleteLibro = async (req, res) => {
    try {
        await Libro.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Libro eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el libro' });
    }
};


exports.getLibroDetalle = async (req, res) => {
    try {
        const libro = await Libro.findById(req.params.id);
        if (!libro) {
            return res.status(404).send('Libro no encontrado');
        }

        
        const totalVisitas = await RedisService.incrementarVisitasLibro(libro.titulo);

        res.render('libros/detalle', { 
            libro,
            totalVisitas
        });
    } catch (error) {
        res.status(500).send('Error al obtener el detalle del libro');
    }
}; 