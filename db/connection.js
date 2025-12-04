const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let isConnected = false;

/**
 * Conecta ao MongoDB
 */
async function conectarMongoDB() {
    if (isConnected) {
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/cidades?authSource=admin';

    try {
        await mongoose.connect(mongoUri);

        isConnected = true;
        console.log('✅ Conectado ao MongoDB');
        return mongoose.connection;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        throw error;
    }
}

/**
 * Desconecta do MongoDB
 */
async function desconectarMongoDB() {
    if (isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        console.log('🔌 Desconectado do MongoDB');
    }
}

/**
 * Verifica se está conectado
 */
function estaConectado() {
    return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
    conectarMongoDB,
    desconectarMongoDB,
    estaConectado
};

