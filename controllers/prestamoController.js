const Prestamo = require('../models/prestamo');
const Libro = require('../models/libro');


exports.getPrestamosActivos = async (req, res) => {
    try {
        const prestamos = await Prestamo.find({
            usuario: req.session.usuario.username,
            devuelto: false
        }).populate('libro');
        
        res.render('prestamos/activos', { prestamos });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener préstamos activos' });
    }
};


exports.getHistorialPrestamos = async (req, res) => {
    try {
        const prestamos = await Prestamo.find({
            usuario: req.session.usuario.username
        }).populate('libro').sort({ fechaPrestamo: -1 });
        
        res.render('prestamos/historial', { prestamos });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial de préstamos' });
    }
};


exports.getTodosPrestamos = async (req, res) => {
    try {
        if (req.session.usuario.rol !== 'admin') {
            return res.status(403).send('Acceso denegado');
        }

        
        const prestamos = await Prestamo.find({})
            .populate('libro')
            .sort({ usuario: 1, fechaPrestamo: -1 });

        
        const prestamosPorUsuario = {};
        prestamos.forEach(prestamo => {
            if (!prestamosPorUsuario[prestamo.usuario]) {
                prestamosPorUsuario[prestamo.usuario] = {
                    activos: [],
                    historial: []
                };
            }
            if (!prestamo.devuelto) {
                prestamosPorUsuario[prestamo.usuario].activos.push(prestamo);
            } else {
                prestamosPorUsuario[prestamo.usuario].historial.push(prestamo);
            }
        });
        
        res.render('prestamos/admin', { prestamosPorUsuario });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
};


exports.procesarDevoluciones = async () => {
    try {
        const prestamosVencidos = await Prestamo.find({
            fechaDevolucion: { $lte: new Date() },
            devuelto: false
        }).populate('libro');

        for (const prestamo of prestamosVencidos) {
            
            await Libro.findByIdAndUpdate(prestamo.libro._id, {
                $inc: { cantidad: prestamo.cantidad }
            });

            
            prestamo.devuelto = true;
            await prestamo.save();
        }
    } catch (error) {
        console.error('Error al procesar devoluciones automáticas:', error);
    }
};


exports.crearPrestamo = async (usuario, libro, cantidad) => {
    try {
        const prestamo = new Prestamo({
            usuario: usuario,
            libro: libro._id,
            cantidad: cantidad
        });
        await prestamo.save();
        return prestamo;
    } catch (error) {
        throw new Error('Error al crear préstamo');
    }
};


exports.getReporte = async (req, res) => {
    try {
        if (req.session.usuario.rol !== 'admin') {
            return res.status(403).send('Acceso denegado');
        }

        
        const prestamos = await Prestamo.find({}).populate('libro');
        const libros = await Libro.find({});

        
        const estadisticas = {
            totalPrestamos: prestamos.length,
            prestamosActivos: prestamos.filter(p => !p.devuelto).length,
            prestamosDevueltos: prestamos.filter(p => p.devuelto).length,
            totalLibros: libros.length,
            librosDisponibles: libros.filter(l => l.cantidad > 0).length,
            librosAgotados: libros.filter(l => l.cantidad === 0).length,
            totalEjemplares: libros.reduce((sum, libro) => sum + libro.cantidad, 0)
        };

        
        const librosPrestados = {};
        prestamos.forEach(prestamo => {
            const libroId = prestamo.libro._id.toString();
            if (!librosPrestados[libroId]) {
                librosPrestados[libroId] = {
                    titulo: prestamo.libro.titulo,
                    autor: prestamo.libro.autor,
                    cantidadPrestamos: 0,
                    cantidadActual: prestamo.libro.cantidad
                };
            }
            librosPrestados[libroId].cantidadPrestamos += prestamo.cantidad;
        });

        const librosMasPrestados = Object.values(librosPrestados)
            .sort((a, b) => b.cantidadPrestamos - a.cantidadPrestamos)
            .slice(0, 5);

        
        const usuariosPrestamos = {};
        prestamos.forEach(prestamo => {
            if (!usuariosPrestamos[prestamo.usuario]) {
                usuariosPrestamos[prestamo.usuario] = {
                    usuario: prestamo.usuario,
                    prestamosActivos: 0,
                    prestamosDevueltos: 0,
                    totalLibros: 0
                };
            }
            if (prestamo.devuelto) {
                usuariosPrestamos[prestamo.usuario].prestamosDevueltos++;
            } else {
                usuariosPrestamos[prestamo.usuario].prestamosActivos++;
            }
            usuariosPrestamos[prestamo.usuario].totalLibros += prestamo.cantidad;
        });

        const usuariosMasActivos = Object.values(usuariosPrestamos)
            .sort((a, b) => (b.prestamosActivos + b.prestamosDevueltos) - (a.prestamosActivos + a.prestamosDevueltos))
            .slice(0, 5);

        res.render('prestamos/reporte', {
            estadisticas,
            librosMasPrestados,
            usuariosMasActivos
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar el reporte' });
    }
}; 