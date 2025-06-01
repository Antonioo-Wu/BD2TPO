const mongoose = require('mongoose');

const carritoSchema = new mongoose.Schema({
  usuario: {
    type: String,
    required: true
  },
  items: [{
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
    }
  }],
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Carrito', carritoSchema); 