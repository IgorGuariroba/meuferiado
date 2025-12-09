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
    async buscarCoordenadasPorEndereco(endereco) {
        try {
            const resultado = await this.googleMapsService.buscarPorEndereco(endereco);
            return resultado;
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
            const localExistente = await this.localModel.findOne({
                place_id: localData.place_id,
            });
            if (localExistente) {
                const temPhotosNovos = localData.photos?.length > 0;
                const temReviewsNovos = localData.reviews?.length > 0;
                const temTelefoneNovo = !!localData.formatted_phone_number;
                const temWebsiteNovo = !!localData.website;
                const temDetalhesNovos = temPhotosNovos || temReviewsNovos || temTelefoneNovo || temWebsiteNovo;
                const photosVazios = !localExistente.photos || localExistente.photos.length === 0;
                const reviewsVazios = !localExistente.reviews || localExistente.reviews.length === 0;
                const telefoneVazio = !localExistente.formatted_phone_number;
                const websiteVazio = !localExistente.website;
                const precisaAtualizar = temDetalhesNovos && (photosVazios || reviewsVazios || telefoneVazio || websiteVazio);
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
            }
            catch (error) {
            }
            const tipoLocal = (0, mapear_tipo_local_util_1.mapearTipoLocal)(tipoQuery);
            const preco = (0, mapear_tipo_local_util_1.estimarPrecoPorPriceLevel)(localData.nivel_preco);
            const local = new this.localModel({
                tipo: tipoLocal,
                nome: localData.nome,
                endereco: localData.endereco || localData.formatted_address || '',
                localizacao: {
                    type: 'Point',
                    coordinates: [localData.coordenadas.lon, localData.coordenadas.lat],
                },
                preco: preco,
                avaliacao: localData.rating || undefined,
                tipos: localData.tipos || [],
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
                });
                return existente;
            }
            return null;
        }
    }
    async buscarLocaisPorCidade(query, city) {
        try {
            const locaisBasicos = await this.googleMapsService.buscarLocaisBasicosPorCidade(query, city);
            if (locaisBasicos.length === 0) {
                return [];
            }
            const placeIds = locaisBasicos
                .map(local => local.place_id)
                .filter(placeId => placeId);
            if (placeIds.length === 0) {
                return [];
            }
            const locaisExistentes = await this.localModel.find({
                place_id: { $in: placeIds },
            }).select('place_id').lean().exec();
            const placeIdsExistentes = new Set(locaisExistentes.map(local => local.place_id));
            const locaisNovosBasicos = locaisBasicos.filter(local => !local.place_id || !placeIdsExistentes.has(local.place_id));
            if (locaisNovosBasicos.length === 0) {
                return [];
            }
            const locais = await this.googleMapsService.buscarDetalhesLocais(locaisNovosBasicos);
            const locaisSalvos = await Promise.allSettled(locais.map(local => this.salvarLocalSeNaoExistir(local, query, city)));
            const salvosComSucesso = [];
            locaisSalvos.forEach((result) => {
                if (result.status === 'fulfilled' && result.value !== null) {
                    salvosComSucesso.push(result.value);
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
            return locaisFormatados;
        }
        catch (error) {
            throw new Error(`Erro ao buscar locais: ${error.message}`);
        }
    }
    async buscarLocaisSalvosPorCidade(city, estado, limit = 50, skip = 0) {
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
            };
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
                const local = await this.localModel.findOneAndDelete({
                    place_id: placeId,
                    cidade: cidade._id,
                });
                if (!local) {
                    throw new Error(`Local com place_id ${placeId} não encontrado na cidade ${city}`);
                }
                return {
                    excluidos: 1,
                    local: {
                        nome: local.nome,
                        place_id: local.place_id,
                    },
                };
            }
            const resultado = await this.localModel.deleteMany({
                cidade: cidade._id,
            });
            return {
                excluidos: resultado.deletedCount || 0,
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