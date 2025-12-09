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
exports.LocaisService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const local_schema_1 = require("../schemas/local.schema");
const google_maps_service_1 = require("../../cidades/services/google-maps.service");
const cidades_service_1 = require("../../cidades/services/cidades.service");
const cidade_schema_1 = require("../../cidades/schemas/cidade.schema");
const calcular_distancia_util_1 = require("../../common/utils/calcular-distancia.util");
let LocaisService = class LocaisService {
    constructor(localModel, cidadeModel, googleMapsService, cidadesService) {
        this.localModel = localModel;
        this.cidadeModel = cidadeModel;
        this.googleMapsService = googleMapsService;
        this.cidadesService = cidadesService;
    }
    async criar(criarLocalDto) {
        let lat;
        let lon;
        if (!criarLocalDto.lat || !criarLocalDto.lon) {
            if (!criarLocalDto.endereco) {
                throw new Error('É necessário fornecer coordenadas (lat/lon) ou um endereço');
            }
            const resultadoGeocode = await this.googleMapsService.buscarPorEndereco(criarLocalDto.endereco);
            lat = resultadoGeocode.coordenadas.lat;
            lon = resultadoGeocode.coordenadas.lon;
        }
        else {
            lat = criarLocalDto.lat;
            lon = criarLocalDto.lon;
        }
        let cidadeId;
        try {
            const cidade = await this.cidadesService.buscarCidadePorCoordenadas(lat, lon, 5);
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
            console.log('Cidade não encontrada para relacionar com o local');
        }
        const local = new this.localModel({
            tipo: criarLocalDto.tipo,
            nome: criarLocalDto.nome,
            descricao: criarLocalDto.descricao,
            endereco: criarLocalDto.endereco,
            localizacao: {
                type: 'Point',
                coordinates: [lon, lat],
            },
            preco: criarLocalDto.preco,
            imagens: criarLocalDto.imagens || [],
            contato: criarLocalDto.contato,
            comodidades: criarLocalDto.comodidades || [],
            avaliacao: criarLocalDto.avaliacao,
            cidade: cidadeId,
        });
        await local.save();
        return local;
    }
    async listar(listarLocaisDto) {
        const query = {};
        if (listarLocaisDto.tipo) {
            query.tipo = listarLocaisDto.tipo;
        }
        if (listarLocaisDto.precoMin !== undefined || listarLocaisDto.precoMax !== undefined) {
            query.preco = {};
            if (listarLocaisDto.precoMin !== undefined) {
                query.preco.$gte = listarLocaisDto.precoMin;
            }
            if (listarLocaisDto.precoMax !== undefined) {
                query.preco.$lte = listarLocaisDto.precoMax;
            }
        }
        let sortBy = { preco: 1 };
        let calcularDistanciaPara = null;
        if (listarLocaisDto.lat && listarLocaisDto.lon && listarLocaisDto.raioKm) {
            const lat = listarLocaisDto.lat;
            const lon = listarLocaisDto.lon;
            const raioKm = listarLocaisDto.raioKm;
            query.localizacao = {
                $geoWithin: {
                    $centerSphere: [
                        [lon, lat],
                        raioKm / 6378.1,
                    ],
                },
            };
            calcularDistanciaPara = { lat, lon };
            sortBy = { localizacao: 'asc' };
        }
        const skip = listarLocaisDto.skip || 0;
        const limit = listarLocaisDto.limit || 20;
        const locais = await this.localModel.find(query).skip(skip).limit(limit).sort(sortBy).exec();
        const total = await this.localModel.countDocuments(query);
        let locaisComDistancia = locais.map(l => l.toObject());
        if (calcularDistanciaPara) {
            locaisComDistancia = locais.map(local => {
                const [lonLocal, latLocal] = local.localizacao.coordinates;
                const distancia = (0, calcular_distancia_util_1.calcularDistancia)(calcularDistanciaPara.lat, calcularDistanciaPara.lon, latLocal, lonLocal);
                const localObj = local.toObject();
                return {
                    ...localObj,
                    distancia_km: Math.round(distancia * 100) / 100,
                };
            });
            locaisComDistancia.sort((a, b) => a.distancia_km - b.distancia_km);
        }
        return {
            locais: locaisComDistancia,
            total,
            limit,
            skip,
        };
    }
    async buscarPorId(id) {
        const local = await this.localModel.findById(id).exec();
        if (!local) {
            throw new common_1.NotFoundException(`Local com ID ${id} não encontrado`);
        }
        return local;
    }
    async atualizar(id, atualizarLocalDto) {
        const local = await this.buscarPorId(id);
        if (atualizarLocalDto.endereco || atualizarLocalDto.lat || atualizarLocalDto.lon) {
            let lat;
            let lon;
            if (atualizarLocalDto.lat && atualizarLocalDto.lon) {
                lat = atualizarLocalDto.lat;
                lon = atualizarLocalDto.lon;
            }
            else if (atualizarLocalDto.endereco) {
                const resultadoGeocode = await this.googleMapsService.buscarPorEndereco(atualizarLocalDto.endereco);
                lat = resultadoGeocode.coordenadas.lat;
                lon = resultadoGeocode.coordenadas.lon;
            }
            else {
                [lon, lat] = local.localizacao.coordinates;
            }
            atualizarLocalDto['localizacao'] = {
                type: 'Point',
                coordinates: [lon, lat],
            };
            try {
                const cidade = await this.cidadesService.buscarCidadePorCoordenadas(lat, lon, 5);
                if (cidade && cidade.cidade && cidade.cidade !== 'Não encontrada') {
                    const cidadeEncontrada = await this.cidadeModel.findOne({
                        nome: cidade.cidade,
                        estado: cidade.estado || '',
                        pais: cidade.pais || '',
                    });
                    if (cidadeEncontrada) {
                        atualizarLocalDto['cidade'] = cidadeEncontrada._id;
                    }
                }
            }
            catch (error) {
            }
        }
        Object.assign(local, atualizarLocalDto);
        await local.save();
        return local;
    }
    async buscarProximos(lat, lon, raioKm, limit = 20) {
        const locais = await this.localModel.find({
            localizacao: {
                $geoWithin: {
                    $centerSphere: [
                        [lon, lat],
                        raioKm / 6378.1,
                    ],
                },
            },
        })
            .limit(limit)
            .exec();
        const locaisComDistancia = locais.map(local => {
            const [lonLocal, latLocal] = local.localizacao.coordinates;
            const distancia = (0, calcular_distancia_util_1.calcularDistancia)(lat, lon, latLocal, lonLocal);
            const localObj = local.toObject();
            return {
                ...localObj,
                distancia_km: Math.round(distancia * 100) / 100,
            };
        });
        locaisComDistancia.sort((a, b) => a.distancia_km - b.distancia_km);
        return locaisComDistancia;
    }
};
exports.LocaisService = LocaisService;
exports.LocaisService = LocaisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(local_schema_1.Local.name)),
    __param(1, (0, mongoose_1.InjectModel)(cidade_schema_1.Cidade.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        google_maps_service_1.GoogleMapsService,
        cidades_service_1.CidadesService])
], LocaisService);
//# sourceMappingURL=locais.service.js.map