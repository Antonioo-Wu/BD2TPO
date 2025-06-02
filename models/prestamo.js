const mongoose = require('mongoose');

const prestamoSchema = new mongoose.Schema({
    usuario: {
        type: String,
        required: true
    },
    libro: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Libro',
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    fechaPrestamo: {
        type: Date,
        default: Date.now
    },
    fechaDevolucion: {
        type: Date,
        default: function() {
            const fecha = new Date();
            fecha.setSeconds(fecha.getSeconds() + 5);
            //fecha.setMinutes(fecha.getMinutes() + 5);
            
            return fecha;
        }
    },
    devuelto: {
        type: Boolean,
        default: false
    }
});


prestamoSchema.index({ fechaDevolucion: 1, devuelto: 1 });

const Prestamo = mongoose.model('Prestamo', prestamoSchema);

module.exports = Prestamo; 