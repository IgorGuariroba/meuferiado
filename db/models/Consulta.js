const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema({
    coordenadas: {
        lat: {
            type: Number,
            required: true
        },
        lon: {
            type: Number,
            required: true
        }
    },
    cidadeAtual: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cidade',
        required: false
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Índice para busca rápida por coordenadas
consultaSchema.index({ 'coordenadas.lat': 1, 'coordenadas.lon': 1 });

const Consulta = mongoose.model('Consulta', consultaSchema);

module.exports = Consulta;

