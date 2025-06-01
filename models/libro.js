const mongoose = require('mongoose');

const libroSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  autor: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true
  },
  disponible: {
    type: Boolean,
    default: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  fechaPublicacion: Date,
  descripcion: String
});

libroSchema.pre('save', function(next) {
  this.disponible = this.cantidad > 0;
  next();
});

module.exports = mongoose.model('Libro', libroSchema); 