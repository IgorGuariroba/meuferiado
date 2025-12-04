const mongoose = require('mongoose');

const cidadeSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    estado: {
        type: String,
        required: false,
        trim: true
    },
    pais: {
        type: String,
        required: false,
        trim: true
    },
    localizacao: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    criadoEm: {
        type: Date,
        default: Date.now
    },
    atualizadoEm: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false // Usamos campos manuais
});

// Índice geográfico 2dsphere para queries de proximidade
cidadeSchema.index({ localizacao: '2dsphere' });

// Índice único composto para evitar duplicatas
cidadeSchema.index({ nome: 1, estado: 1, pais: 1 }, { unique: true });

// Índice para busca rápida por nome
cidadeSchema.index({ nome: 1 });

// Atualizar atualizadoEm antes de salvar
cidadeSchema.pre('save', async function() {
    this.atualizadoEm = new Date();
});

const Cidade = mongoose.model('Cidade', cidadeSchema);

module.exports = Cidade;

