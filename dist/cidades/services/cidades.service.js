"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CidadesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cidade_schema_1 = require("../schemas/cidade.schema");
const local_schema_1 = require("../../locais/schemas/local.schema");
const termo_busca_schema_1 = require("../schemas/termo-busca.schema");
const google_maps_service_1 = require("./google-maps.service");
const calcular_distancia_util_1 = require("../../common/utils/calcular-distancia.util");
const mapear_tipo_local_util_1 = require("../utils/mapear-tipo-local.util");
let CidadesService = class CidadesService {
    constructor(cidadeModel, localModel, termoBuscaModel, googleMapsService) {
        this.cidadeModel = cidadeModel;
        this.localModel = localModel;
        this.termoBuscaModel = termoBuscaModel;
        this.googleMapsService = googleMapsService;
    }
    async buscarCidadePorCoordenadas(lat, lon, raioKm = 1) {
        try {
            const cidades = await this.cidadeModel.find({
                localizacao: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [lon, lat],
                        },
                        $maxDistance: raioKm * 1000,
                    },
                },
            }).limit(1);
            if (cidades.length > 0) {
                const cidade = cidades[0];
                return {
                    cidade: cidade.nome,
                    estado: cidade.estado || '',
                    pais: cidade.pais || '',
                    endereco_completo: `${cidade.nome}${cidade.estado ? ', ' + cidade.estado : ''}${cidade.pais ? ', ' + cidade.pais : ''}`,
                };
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    async buscarCidadesProximas(lat, lon, raioKm) {
        try {
            const cidades = await this.cidadeModel.find({
                localizacao: {
                    $geoWithin: {
                        $centerSphere: [
                            [lon, lat],
                            raioKm / 6378.1,
                        ],
                    },
                },
            });
            const cidadesComDistancia = cidades.map(cidade => {
                const [lonCidade, latCidade] = cidade.localizacao.coordinates;
                const distancia = (0, calcular_distancia_util_1.calcularDistancia)(lat, lon, latCidade, lonCidade);
                return {
                    nome: cidade.nome,
                    estado: cidade.estado || '',
                    pais: cidade.pais || '',
                    distancia_km: Math.round(distancia * 100) / 100,
                    lat: latCidade,
                    lon: lonCidade,
                };
            });
            cidadesComDistancia.sort((a, b) => a.distancia_km - b.distancia_km);
            return cidadesComDistancia;
        }
        catch (error) {
            return [];
        }
    }
    async salvarCidade(nome, estado, pais, lat, lon) {
        try {
            const cidadeExistente = await this.cidadeModel.findOne({
                nome,
                estado: estado || '',
                pais: pais || '',
            });
            if (cidadeExistente) {
                return cidadeExistente;
            }
            const cidade = new this.cidadeModel({
                nome,
                estado: estado || '',
                pais: pais || '',
                localizacao: {
                    type: 'Point',
                    coordinates: [lon, lat],
                },
            });
            await cidade.save();
            return cidade;
        }
        catch (error) {
            if (error.code === 11000) {
                return await this.cidadeModel.findOne({
                    nome,
                    estado: estado || '',
                    pais: pais || '',
                });
            }
            return null;
        }
    }
    async salvarCidades(cidades) {
        const resultados = [];
        for (const cidade of cidades) {
            const resultado = await this.salvarCidade(cidade.nome, cidade.estado, cidade.pais, cidade.lat, cidade.lon);
            if (resultado) {
                resultados.push(resultado);
            }
        }
        return resultados;
    }
    async buscarCoordenadasPorEndereco(endereco, coordenadasValidadas, raioValidacaoKm = 5) {
        try {
            const partes = endereco.split(',').map(p => p.trim());
            const nomeCidade = partes[0];
            const estado = partes.length > 1 ? partes[1] : null;
            const queryCidade = {
                nome: { $regex: new RegExp(`^${nomeCidade}$`, 'i') },
            };
            if (estado && estado.length <= 3) {
                queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
            }
            const cidadeMongo = await this.cidadeModel.findOne(queryCidade);
            if (cidadeMongo && cidadeMongo.localizacao) {
                const [lon, lat] = cidadeMongo.localizacao.coordinates;
                if (coordenadasValidadas) {
                    const distancia = (0, calcular_distancia_util_1.calcularDistancia)(coordenadasValidadas.lat, coordenadasValidadas.lon, lat, lon);
                    if (distancia > raioValidacaoKm) {
                    }
                    else {
                        return {
                            cidade: cidadeMongo.nome,
                            estado: cidadeMongo.estado || '',
                            pais: cidadeMongo.pais || 'BR',
                            endereco_completo: `${cidadeMongo.nome}${cidadeMongo.estado ? ', ' + cidadeMongo.estado : ''}${cidadeMongo.pais ? ', ' + cidadeMongo.pais : ''}`,
                            coordenadas: {
                                lat,
                                lon,
                            },
                            doMongoDB: true,
                        };
                    }
                }
                else {
                    return {
                        cidade: cidadeMongo.nome,
                        estado: cidadeMongo.estado || '',
                        pais: cidadeMongo.pais || 'BR',
                        endereco_completo: `${cidadeMongo.nome}${cidadeMongo.estado ? ', ' + cidadeMongo.estado : ''}${cidadeMongo.pais ? ', ' + cidadeMongo.pais : ''}`,
                        coordenadas: {
                            lat,
                            lon,
                        },
                        doMongoDB: true,
                    };
                }
            }
            const resultado = await this.googleMapsService.buscarPorEndereco(endereco);
            if (resultado.cidade && resultado.cidade !== 'Não encontrada' && resultado.coordenadas) {
                await this.salvarCidade(resultado.cidade, resultado.estado || '', resultado.pais || 'BR', resultado.coordenadas.lat, resultado.coordenadas.lon);
            }
            return {
                ...resultado,
                doMongoDB: false,
            };
        }
        catch (error) {
            throw new Error(`Erro ao buscar endereço: ${error.message}`);
        }
    }
    async obterCidadeAtual(lat, lon) {
        const cidadeMongo = await this.buscarCidadePorCoordenadas(lat, lon, 1);
        if (cidadeMongo) {
            return { ...cidadeMongo, doMongoDB: true };
        }
        const cidadeApi = await this.googleMapsService.obterCidadeAtual(lat, lon);
        if (cidadeApi.cidade && cidadeApi.cidade !== 'Não encontrada') {
            await this.salvarCidade(cidadeApi.cidade, cidadeApi.estado, cidadeApi.pais, cidadeApi.coordenadas.lat, cidadeApi.coordenadas.lon);
        }
        return { ...cidadeApi, doMongoDB: false };
    }
    async obterCidadesVizinhas(lat, lon, raioKm, limit, skip) {
        const cidadesMongo = await this.buscarCidadesProximas(lat, lon, raioKm);
        if (cidadesMongo.length >= 3) {
            const cidadeMaisDistante = cidadesMongo[cidadesMongo.length - 1];
            const distanciaMaxima = cidadeMaisDistante?.distancia_km || 0;
            const threshold = raioKm * 0.8;
            if (distanciaMaxima < threshold) {
                const cidadesApi = await this.googleMapsService.obterCidadesVizinhas(lat, lon, raioKm);
                if (cidadesApi.length > 0) {
                    await this.salvarCidades(cidadesApi);
                }
                const todasCidades = [...cidadesMongo, ...cidadesApi];
                const cidadesUnicas = new Map();
                for (const cidade of todasCidades) {
                    const key = `${cidade.nome.toLowerCase()}_${cidade.estado}_${cidade.pais}`;
                    if (!cidadesUnicas.has(key)) {
                        cidadesUnicas.set(key, cidade);
                    }
                }
                const resultado = Array.from(cidadesUnicas.values())
                    .sort((a, b) => a.distancia_km - b.distancia_km);
                const total = resultado.length;
                const skipValue = skip || 0;
                const limitValue = limit || 20;
                const cidadesPaginadas = resultado.slice(skipValue, skipValue + limitValue);
                return {
                    cidades: cidadesPaginadas,
                    total,
                    limit: limitValue,
                    skip: skipValue,
                    doMongoDB: false,
                };
            }
            else {
                const total = cidadesMongo.length;
                const skipValue = skip || 0;
                const limitValue = limit || 20;
                const cidadesPaginadas = cidadesMongo.slice(skipValue, skipValue + limitValue);
                return {
                    cidades: cidadesPaginadas,
                    total,
                    limit: limitValue,
                    skip: skipValue,
                    doMongoDB: true
                };
            }
        }
        const cidadesApi = await this.googleMapsService.obterCidadesVizinhas(lat, lon, raioKm);
        if (cidadesApi.length > 0) {
            await this.salvarCidades(cidadesApi);
        }
        const todasCidades = [...cidadesMongo, ...cidadesApi];
        const cidadesUnicas = new Map();
        for (const cidade of todasCidades) {
            const key = `${cidade.nome.toLowerCase()}_${cidade.estado}_${cidade.pais}`;
            if (!cidadesUnicas.has(key)) {
                cidadesUnicas.set(key, cidade);
            }
        }
        const resultado = Array.from(cidadesUnicas.values())
            .sort((a, b) => a.distancia_km - b.distancia_km);
        const total = resultado.length;
        const skipValue = skip || 0;
        const limitValue = limit || 20;
        const cidadesPaginadas = resultado.slice(skipValue, skipValue + limitValue);
        return {
            cidades: cidadesPaginadas,
            total,
            limit: limitValue,
            skip: skipValue,
            doMongoDB: false
        };
    }
    async listarTodasCidades(limit, skip) {
        try {
            const query = this.cidadeModel.find().sort({ criadoEm: -1 });
            if (skip) {
                query.skip(skip);
            }
            if (limit) {
                query.limit(limit);
            }
            const cidades = await query.exec();
            const total = await this.cidadeModel.countDocuments();
            return {
                cidades: cidades.map(cidade => ({
                    nome: cidade.nome,
                    estado: cidade.estado || '',
                    pais: cidade.pais || '',
                    lat: cidade.localizacao.coordinates[1],
                    lon: cidade.localizacao.coordinates[0],
                    criadoEm: cidade.criadoEm,
                    atualizadoEm: cidade.atualizadoEm,
                })),
                total,
                limit: limit || total,
                skip: skip || 0,
            };
        }
        catch (error) {
            throw new Error(`Erro ao listar cidades: ${error.message}`);
        }
    }
    async salvarLocalSeNaoExistir(localData, tipoQuery, city) {
        try {
            if (!localData.place_id) {
                return null;
            }
            if (!localData.nome || !localData.nome.trim()) {
                return null;
            }
            if (!localData.endereco && !localData.formatted_address) {
                return null;
            }
            if (!localData.coordenadas || !localData.coordenadas.lat || !localData.coordenadas.lon) {
                return null;
            }
            const localExistente = await this.localModel.findOne({
                place_id: localData.place_id,
            });
            if (localExistente) {
                if (localExistente.deletedAt) {
                    return null;
                }
                let precisaAtualizarCidade = false;
                if (!localExistente.cidade) {
                    let cidadeId;
                    try {
                        const cidade = await this.buscarCidadePorCoordenadas(localData.coordenadas.lat, localData.coordenadas.lon, 5);
                        if (cidade && cidade.cidade && cidade.cidade !== 'Não encontrada') {
                            const cidadeEncontrada = await this.cidadeModel.findOne({
                                nome: cidade.cidade,
                                estado: cidade.estado || '',
                                pais: cidade.pais || '',
                            });
                            if (cidadeEncontrada) {
                                cidadeId = cidadeEncontrada._id;
                            }
                        }
                        if (!cidadeId && city) {
                            const cidadePorNome = await this.cidadeModel.findOne({
                                nome: { $regex: new RegExp(`^${city}$`, 'i') },
                            });
                            if (cidadePorNome) {
                                cidadeId = cidadePorNome._id;
                            }
                        }
                        if (cidadeId) {
                            localExistente.cidade = cidadeId;
                            precisaAtualizarCidade = true;
                        }
                    }
                    catch (error) {
                    }
                }
                let precisaAtualizarCategoria = false;
                if (tipoQuery && tipoQuery.trim()) {
                    const categoriaNormalizada = tipoQuery.trim().toLowerCase();
                    const categoriasExistentes = localExistente.categorias || [];
                    if (!categoriasExistentes.includes(categoriaNormalizada)) {
                        localExistente.categorias = [...categoriasExistentes, categoriaNormalizada];
                        precisaAtualizarCategoria = true;
                    }
                }
                const temPhotosNovos = localData.photos?.length > 0;
                const temReviewsNovos = localData.reviews?.length > 0;
                const temTelefoneNovo = !!localData.formatted_phone_number;
                const temWebsiteNovo = !!localData.website;
                const temDetalhesNovos = temPhotosNovos || temReviewsNovos || temTelefoneNovo || temWebsiteNovo;
                const photosVazios = !localExistente.photos || localExistente.photos.length === 0;
                const reviewsVazios = !localExistente.reviews || localExistente.reviews.length === 0;
                const telefoneVazio = !localExistente.formatted_phone_number;
                const websiteVazio = !localExistente.website;
                const precisaAtualizarDetalhes = temDetalhesNovos && (photosVazios || reviewsVazios || telefoneVazio || websiteVazio);
                const precisaAtualizar = precisaAtualizarCidade || precisaAtualizarCategoria || precisaAtualizarDetalhes;
                if (precisaAtualizar) {
                    if (temPhotosNovos && photosVazios) {
                        localExistente.photos = localData.photos;
                    }
                    if (temReviewsNovos && reviewsVazios) {
                        localExistente.reviews = localData.reviews;
                    }
                    if (temTelefoneNovo && telefoneVazio) {
                        localExistente.formatted_phone_number = localData.formatted_phone_number;
                    }
                    if (temWebsiteNovo && websiteVazio) {
                        localExistente.website = localData.website;
                    }
                    if (localData.url)
                        localExistente.url = localData.url;
                    if (localData.opening_hours)
                        localExistente.opening_hours = localData.opening_hours;
                    if (localData.current_opening_hours)
                        localExistente.current_opening_hours = localData.current_opening_hours;
                    if (localData.open_now !== undefined)
                        localExistente.open_now = localData.open_now;
                    if (localData.formatted_address)
                        localExistente.formatted_address = localData.formatted_address;
                    if (localData.address_components?.length)
                        localExistente.address_components = localData.address_components;
                    if (localData.business_status)
                        localExistente.business_status = localData.business_status;
                    await localExistente.save();
                    return localExistente;
                }
                return localExistente;
            }
            let cidadeId;
            try {
                const cidade = await this.buscarCidadePorCoordenadas(localData.coordenadas.lat, localData.coordenadas.lon, 5);
                if (cidade && cidade.cidade && cidade.cidade !== 'Não encontrada') {
                    const cidadeEncontrada = await this.cidadeModel.findOne({
                        nome: cidade.cidade,
                        estado: cidade.estado || '',
                        pais: cidade.pais || '',
                    });
                    if (cidadeEncontrada) {
                        cidadeId = cidadeEncontrada._id;
                    }
                }
                if (!cidadeId && city) {
                    const cidadePorNome = await this.cidadeModel.findOne({
                        nome: { $regex: new RegExp(`^${city}$`, 'i') },
                    });
                    if (cidadePorNome) {
                        cidadeId = cidadePorNome._id;
                    }
                }
            }
            catch (error) {
            }
            const tipoLocal = (0, mapear_tipo_local_util_1.mapearTipoLocal)(tipoQuery);
            const preco = (0, mapear_tipo_local_util_1.estimarPrecoPorPriceLevel)(localData.nivel_preco);
            const endereco = localData.endereco || localData.formatted_address || '';
            if (!endereco.trim()) {
                return null;
            }
            const categorias = tipoQuery && tipoQuery.trim()
                ? [tipoQuery.trim().toLowerCase()]
                : [];
            const local = new this.localModel({
                tipo: tipoLocal,
                nome: localData.nome.trim(),
                endereco: endereco.trim(),
                localizacao: {
                    type: 'Point',
                    coordinates: [localData.coordenadas.lon, localData.coordenadas.lat],
                },
                preco: preco,
                avaliacao: localData.rating || undefined,
                tipos: localData.tipos || [],
                categorias: categorias,
                total_avaliacoes: localData.total_avaliacoes || 0,
                place_id: localData.place_id,
                cidade: cidadeId,
                descricao: `Local encontrado em ${city}`,
                photos: localData.photos || localData.fotos || [],
                formatted_phone_number: localData.formatted_phone_number || localData.telefone_formatado || undefined,
                website: localData.website || undefined,
                url: localData.url || localData.url_google_maps || undefined,
                contato: (localData.formatted_phone_number || localData.telefone_formatado) ? {
                    telefone: localData.formatted_phone_number || localData.telefone_formatado,
                    email: undefined,
                } : undefined,
                opening_hours: localData.opening_hours || undefined,
                current_opening_hours: localData.current_opening_hours || undefined,
                open_now: localData.open_now || false,
                reviews: localData.reviews || [],
                formatted_address: localData.formatted_address || localData.endereco || undefined,
                address_components: localData.address_components || [],
                business_status: localData.business_status || undefined,
            });
            const localSalvo = await local.save();
            return localSalvo;
        }
        catch (error) {
            if (error.code === 11000) {
                const existente = await this.localModel.findOne({
                    place_id: localData.place_id,
                    deletedAt: null,
                });
                if (existente) {
                    return existente;
                }
            }
            throw error;
        }
    }
    async buscarLocaisPorCidade(query, city) {
        try {
            let coordenadasCidade = null;
            let estadoCidade = null;
            try {
                const enderecoInfo = await this.buscarCoordenadasPorEndereco(city);
                if (enderecoInfo && enderecoInfo.coordenadas) {
                    coordenadasCidade = enderecoInfo.coordenadas;
                    estadoCidade = enderecoInfo.estado || null;
                }
            }
            catch (error) {
            }
            const locaisBasicos = await this.googleMapsService.buscarLocaisBasicosPorCidade(query, city, coordenadasCidade);
            if (locaisBasicos.length === 0) {
                return [];
            }
            let locaisComPlaceId = locaisBasicos.filter(local => local.place_id);
            if (coordenadasCidade) {
                const raioMaximoKm = 50;
                locaisComPlaceId = locaisComPlaceId.filter(local => {
                    if (!local.coordenadas || !local.coordenadas.lat || !local.coordenadas.lon) {
                        return false;
                    }
                    const distancia = (0, calcular_distancia_util_1.calcularDistancia)(coordenadasCidade.lat, coordenadasCidade.lon, local.coordenadas.lat, local.coordenadas.lon);
                    return distancia <= raioMaximoKm;
                });
            }
            if (estadoCidade && locaisComPlaceId.length > 0) {
                locaisComPlaceId = locaisComPlaceId.filter(local => {
                    if (!local.endereco && !local.formatted_address) {
                        return true;
                    }
                    const enderecoCompleto = (local.endereco || local.formatted_address || '').toUpperCase();
                    const estadoUpper = estadoCidade.toUpperCase();
                    return enderecoCompleto.includes(estadoUpper) ||
                        enderecoCompleto.includes(estadoUpper.replace('SP', 'SÃO PAULO'));
                });
            }
            if (locaisComPlaceId.length === 0) {
                return [];
            }
            const locais = await this.googleMapsService.buscarDetalhesLocais(locaisComPlaceId);
            const locaisSalvos = await Promise.allSettled(locais.map(local => this.salvarLocalSeNaoExistir(local, query, city)));
            const salvosComSucesso = [];
            const errosSalvamento = [];
            locaisSalvos.forEach((result, index) => {
                const local = locais[index];
                if (result.status === 'fulfilled' && result.value !== null) {
                    salvosComSucesso.push(result.value);
                }
                else if (result.status === 'rejected') {
                    const erro = {
                        nome: local?.nome || 'Desconhecido',
                        place_id: local?.place_id || 'N/A',
                        erro: result.reason?.message || String(result.reason),
                        stack: result.reason?.stack,
                    };
                    errosSalvamento.push(erro);
                }
                else if (result.status === 'fulfilled' && result.value === null) {
                    const erro = {
                        nome: local?.nome || 'Desconhecido',
                        place_id: local?.place_id || 'N/A',
                        erro: 'Local retornou null (pode não ter passado na validação ou já estar deletado)',
                    };
                    errosSalvamento.push(erro);
                }
            });
            const locaisFormatados = locais.map(local => {
                const localSalvo = salvosComSucesso.find(l => l.place_id === local.place_id);
                return {
                    id: localSalvo?._id?.toString() || null,
                    tipo: localSalvo?.tipo || (0, mapear_tipo_local_util_1.mapearTipoLocal)(query),
                    nome: local.nome,
                    descricao: localSalvo?.descricao || `Local encontrado em ${city}`,
                    endereco: local.endereco,
                    formatted_address: local.formatted_address || local.endereco,
                    coordenadas: local.coordenadas,
                    preco: localSalvo?.preco || (0, mapear_tipo_local_util_1.estimarPrecoPorPriceLevel)(local.nivel_preco),
                    avaliacao: local.rating || localSalvo?.avaliacao,
                    place_id: local.place_id,
                    categorias: localSalvo?.categorias || [],
                    photos: local.photos || [],
                    formatted_phone_number: local.formatted_phone_number,
                    website: local.website,
                    url: local.url,
                    opening_hours: local.opening_hours || [],
                    current_opening_hours: local.current_opening_hours,
                    open_now: local.open_now || false,
                    reviews: local.reviews || [],
                    address_components: local.address_components || [],
                    business_status: local.business_status,
                    criadoEm: localSalvo?.criadoEm || null,
                    atualizadoEm: localSalvo?.atualizadoEm || null,
                };
            });
            if (errosSalvamento.length > 0) {
                locaisFormatados.forEach((localFormatado) => {
                    const erro = errosSalvamento.find(e => e.place_id === localFormatado.place_id);
                    if (erro) {
                        localFormatado.erroSalvamento = erro.erro;
                        localFormatado.salvo = false;
                    }
                    else {
                        localFormatado.salvo = true;
                    }
                });
            }
            else {
                locaisFormatados.forEach(local => {
                    local.salvo = true;
                });
            }
            return locaisFormatados;
        }
        catch (error) {
            throw new Error(`Erro ao buscar locais: ${error.message}`);
        }
    }
    async buscarLocaisSalvosPorCidade(city, estado, limit = 50, skip = 0, nome) {
        try {
            const limitFinal = Math.min(Math.max(1, limit || 50), 100);
            const skipFinal = Math.max(0, skip || 0);
            const queryCidade = {
                nome: { $regex: new RegExp(`^${city}$`, 'i') },
            };
            if (estado) {
                queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
            }
            const cidade = await this.cidadeModel.findOne(queryCidade);
            if (!cidade) {
                console.warn(`[buscarLocaisSalvosPorCidade] Cidade "${city}" não encontrada no banco de dados.`);
                return {
                    locais: [],
                    total: 0,
                    cidade: null,
                    limit: limitFinal,
                    skip: skipFinal,
                };
            }
            console.log(`[buscarLocaisSalvosPorCidade] Cidade encontrada: ${cidade.nome} (ID: ${cidade._id})`);
            const queryLocais = {
                cidade: cidade._id,
                deletedAt: null,
            };
            if (nome) {
                queryLocais.nome = { $regex: new RegExp(nome, 'i') };
            }
            const [locais, total] = await Promise.all([
                this.localModel
                    .find(queryLocais)
                    .limit(limitFinal)
                    .skip(skipFinal)
                    .sort({ criadoEm: -1 })
                    .lean()
                    .exec(),
                this.localModel.countDocuments(queryLocais),
            ]);
            const locaisFormatados = locais.map(local => ({
                nome: local.nome,
                endereco: local.endereco || local.formatted_address || '',
                coordenadas: {
                    lat: local.localizacao.coordinates[1],
                    lon: local.localizacao.coordinates[0],
                },
                rating: local.avaliacao || null,
                total_avaliacoes: local.total_avaliacoes || local.reviews?.length || null,
                tipos: local.tipos || [],
                categorias: local.categorias || [],
                place_id: local.place_id,
                nivel_preco: local.preco ? (local.preco >= 1200 ? 4 : local.preco >= 600 ? 3 : local.preco >= 300 ? 2 : local.preco >= 150 ? 1 : 0) : null,
                photos: local.photos || [],
                formatted_phone_number: local.formatted_phone_number,
                website: local.website,
                url: local.url,
                opening_hours: local.opening_hours || [],
                current_opening_hours: local.current_opening_hours,
                open_now: local.open_now || false,
                reviews: local.reviews || [],
                formatted_address: local.formatted_address || local.endereco || '',
                address_components: local.address_components || [],
                business_status: local.business_status,
            }));
            return {
                locais: locaisFormatados,
                total,
                cidade: {
                    id: cidade._id.toString(),
                    nome: cidade.nome,
                    estado: cidade.estado,
                    pais: cidade.pais,
                },
                limit: limitFinal,
                skip: skipFinal,
            };
        }
        catch (error) {
            throw new Error(`Erro ao buscar locais salvos: ${error.message}`);
        }
    }
    async atualizarLocaisSemDetalhes(city, estado, limit = 10) {
        try {
            const queryCidade = {
                nome: { $regex: new RegExp(`^${city}$`, 'i') },
            };
            if (estado) {
                queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
            }
            const cidade = await this.cidadeModel.findOne(queryCidade);
            if (!cidade) {
                throw new Error(`Cidade não encontrada: ${city}`);
            }
            const queryLocais = {
                cidade: cidade._id,
                deletedAt: null,
                $or: [
                    { photos: { $exists: false } },
                    { photos: { $size: 0 } },
                    { reviews: { $exists: false } },
                    { reviews: { $size: 0 } },
                    { formatted_phone_number: { $exists: false } },
                    { formatted_phone_number: null },
                    { website: { $exists: false } },
                    { website: null },
                ],
            };
            const locaisSemDetalhes = await this.localModel
                .find(queryLocais)
                .limit(limit)
                .exec();
            const resultados = {
                atualizados: 0,
                erros: 0,
                locais: [],
            };
            for (const local of locaisSemDetalhes) {
                if (!local.place_id) {
                    continue;
                }
                try {
                    const detalhes = await this.googleMapsService.buscarDetalhesLocal(`places/${local.place_id}`);
                    if (!detalhes) {
                        continue;
                    }
                    let atualizouAlgo = false;
                    if (detalhes.photos?.length > 0 && (!local.photos || local.photos.length === 0)) {
                        local.photos = detalhes.photos.map((photo) => ({
                            photo_reference: photo.name || null,
                            width: photo.widthPx || null,
                            height: photo.heightPx || null,
                        }));
                        atualizouAlgo = true;
                    }
                    if (detalhes.reviews?.length > 0 && (!local.reviews || local.reviews.length === 0)) {
                        local.reviews = detalhes.reviews.map((review) => ({
                            autor: review.authorAttribution?.displayName || 'Anônimo',
                            rating: review.rating || null,
                            texto: review.text?.text || '',
                            data: review.publishTime || null,
                        }));
                        atualizouAlgo = true;
                    }
                    if (detalhes.nationalPhoneNumber && !local.formatted_phone_number) {
                        local.formatted_phone_number = detalhes.nationalPhoneNumber || detalhes.internationalPhoneNumber;
                    }
                    if (detalhes.websiteUri && !local.website) {
                        local.website = detalhes.websiteUri;
                    }
                    if (detalhes.googleMapsUri && !local.url) {
                        local.url = detalhes.googleMapsUri;
                    }
                    if (detalhes.formattedAddress && !local.formatted_address) {
                        local.formatted_address = detalhes.formattedAddress;
                    }
                    if (detalhes.addressComponents?.length > 0 && (!local.address_components || local.address_components.length === 0)) {
                        local.address_components = detalhes.addressComponents.map((comp) => ({
                            tipo: comp.types || [],
                            nome_longo: comp.longText || null,
                            nome_curto: comp.shortText || null,
                            linguagem: comp.languageCode || null,
                        }));
                    }
                    if (detalhes.businessStatus && !local.business_status) {
                        local.business_status = detalhes.businessStatus;
                    }
                    if (detalhes.types && (!local.tipos || local.tipos.length === 0)) {
                        local.tipos = detalhes.types;
                    }
                    if (detalhes.userRatingCount && !local.total_avaliacoes) {
                        local.total_avaliacoes = detalhes.userRatingCount;
                    }
                    if (atualizouAlgo) {
                        await local.save();
                        resultados.atualizados++;
                        resultados.locais.push({
                            nome: local.nome,
                            place_id: local.place_id,
                            atualizado: true,
                        });
                    }
                    else {
                        resultados.locais.push({
                            nome: local.nome,
                            place_id: local.place_id,
                            atualizado: false,
                            motivo: 'API não retornou photos/reviews/telefone/website',
                        });
                    }
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                catch (error) {
                    resultados.erros++;
                }
            }
            return resultados;
        }
        catch (error) {
            throw new Error(`Erro ao atualizar locais: ${error.message}`);
        }
    }
    async excluirLocaisSalvos(city, estado, placeId) {
        try {
            const queryCidade = {
                nome: { $regex: new RegExp(`^${city}$`, 'i') },
            };
            if (estado) {
                queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
            }
            const cidade = await this.cidadeModel.findOne(queryCidade);
            if (!cidade) {
                throw new Error(`Cidade não encontrada: ${city}`);
            }
            if (placeId) {
                const local = await this.localModel.findOneAndUpdate({
                    place_id: placeId,
                    cidade: cidade._id,
                    deletedAt: null,
                }, {
                    $set: { deletedAt: new Date() },
                }, {
                    new: true,
                });
                if (!local) {
                    throw new Error(`Local com place_id ${placeId} não encontrado na cidade ${city} ou já foi excluído`);
                }
                return {
                    excluidos: 1,
                    local: {
                        nome: local.nome,
                        place_id: local.place_id,
                        deletedAt: local.deletedAt,
                    },
                };
            }
            const resultado = await this.localModel.updateMany({
                cidade: cidade._id,
                deletedAt: null,
            }, {
                $set: { deletedAt: new Date() },
            });
            return {
                excluidos: resultado.modifiedCount || 0,
                cidade: {
                    nome: cidade.nome,
                    estado: cidade.estado,
                    pais: cidade.pais,
                },
            };
        }
        catch (error) {
            throw new Error(`Erro ao excluir locais: ${error.message}`);
        }
    }
    gerarUrlFoto(photoReference, maxWidth = 800, maxHeight = 600) {
        return this.googleMapsService.gerarUrlFoto(photoReference, maxWidth, maxHeight);
    }
    async buscarLocaisExcluidos(city, estado, limit = 50, skip = 0) {
        try {
            const limitFinal = Math.min(Math.max(1, limit || 50), 100);
            const skipFinal = Math.max(0, skip || 0);
            const queryCidade = {
                nome: { $regex: new RegExp(`^${city}$`, 'i') },
            };
            if (estado) {
                queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
            }
            const cidade = await this.cidadeModel.findOne(queryCidade);
            if (!cidade) {
                return {
                    locais: [],
                    total: 0,
                    cidade: null,
                    limit: limitFinal,
                    skip: skipFinal,
                };
            }
            const queryLocais = {
                cidade: cidade._id,
                deletedAt: { $ne: null },
            };
            const [locais, total] = await Promise.all([
                this.localModel
                    .find(queryLocais)
                    .limit(limitFinal)
                    .skip(skipFinal)
                    .sort({ deletedAt: -1 })
                    .lean()
                    .exec(),
                this.localModel.countDocuments(queryLocais),
            ]);
            const locaisFormatados = locais.map((local) => ({
                id: local._id.toString(),
                tipo: local.tipo,
                nome: local.nome,
                descricao: local.descricao || `Local encontrado em ${city}`,
                endereco: local.endereco,
                formatted_address: local.formatted_address || local.endereco,
                coordenadas: {
                    lat: local.localizacao?.coordinates?.[1] || null,
                    lon: local.localizacao?.coordinates?.[0] || null,
                },
                preco: local.preco || 0,
                avaliacao: local.avaliacao,
                place_id: local.place_id,
                photos: local.photos || [],
                formatted_phone_number: local.formatted_phone_number,
                website: local.website,
                url: local.url,
                opening_hours: local.opening_hours || [],
                current_opening_hours: local.current_opening_hours,
                open_now: local.open_now || false,
                reviews: local.reviews || [],
                address_components: local.address_components || [],
                business_status: local.business_status,
                deletedAt: local.deletedAt,
                criadoEm: local.criadoEm,
                atualizadoEm: local.atualizadoEm,
            }));
            return {
                locais: locaisFormatados,
                total,
                cidade: {
                    id: cidade._id.toString(),
                    nome: cidade.nome,
                    estado: cidade.estado,
                    pais: cidade.pais,
                },
                limit: limitFinal,
                skip: skipFinal,
            };
        }
        catch (error) {
            throw new Error(`Erro ao buscar locais excluídos: ${error.message}`);
        }
    }
    async listarTermosBusca(ativo) {
        try {
            const query = {};
            if (ativo !== undefined) {
                query.ativo = ativo;
            }
            const termos = await this.termoBuscaModel
                .find(query)
                .sort({ termo: 1 })
                .lean()
                .exec();
            return {
                termos,
                total: termos.length,
            };
        }
        catch (error) {
            throw new Error(`Erro ao listar termos de busca: ${error.message}`);
        }
    }
    async criarTermoBusca(termo, descricao, ativo = true) {
        try {
            const termoNormalizado = termo.toLowerCase().trim();
            const existente = await this.termoBuscaModel.findOne({
                termo: termoNormalizado,
            });
            if (existente) {
                throw new Error(`Termo "${termo}" já existe`);
            }
            const novoTermo = new this.termoBuscaModel({
                termo: termoNormalizado,
                descricao,
                ativo,
            });
            const termoSalvo = await novoTermo.save();
            return termoSalvo;
        }
        catch (error) {
            if (error.message.includes('já existe')) {
                throw error;
            }
            throw new Error(`Erro ao criar termo de busca: ${error.message}`);
        }
    }
    async excluirTermoBusca(termo) {
        try {
            const termoNormalizado = termo.toLowerCase().trim();
            const resultado = await this.termoBuscaModel.findOneAndDelete({
                termo: termoNormalizado,
            });
            if (!resultado) {
                throw new Error(`Termo "${termo}" não encontrado`);
            }
            return {
                termo: resultado.termo,
                excluido: true,
            };
        }
        catch (error) {
            if (error.message.includes('não encontrado')) {
                throw error;
            }
            throw new Error(`Erro ao excluir termo de busca: ${error.message}`);
        }
    }
};
exports.CidadesService = CidadesService;
exports.CidadesService = CidadesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(cidade_schema_1.Cidade.name)),
    __param(1, (0, mongoose_1.InjectModel)(local_schema_1.Local.name)),
    __param(2, (0, mongoose_1.InjectModel)(termo_busca_schema_1.TermoBusca.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        google_maps_service_1.GoogleMapsService])
], CidadesService);
//# sourceMappingURL=cidades.service.js.map