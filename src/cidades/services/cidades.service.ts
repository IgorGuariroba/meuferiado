import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cidade, CidadeDocument } from '../schemas/cidade.schema';
import { GoogleMapsService } from './google-maps.service';
import { calcularDistancia } from '../../common/utils/calcular-distancia.util';

@Injectable()
export class CidadesService {
  constructor(
    @InjectModel(Cidade.name) private cidadeModel: Model<CidadeDocument>,
    private googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Busca cidade por coordenadas próximas (raio pequeno ~1km)
   */
  async buscarCidadePorCoordenadas(lat: number, lon: number, raioKm: number = 1) {
    try {
      const cidades = await this.cidadeModel.find({
        localizacao: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lon, lat], // [longitude, latitude]
            },
            $maxDistance: raioKm * 1000, // Converter km para metros
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
    } catch (error) {
      console.error('Erro ao buscar cidade por coordenadas:', error.message);
      return null;
    }
  }

  /**
   * Busca cidades próximas dentro de um raio (em km)
   */
  async buscarCidadesProximas(lat: number, lon: number, raioKm: number) {
    try {
      const cidades = await this.cidadeModel.find({
        localizacao: {
          $geoWithin: {
            $centerSphere: [
              [lon, lat], // [longitude, latitude]
              raioKm / 6378.1, // Converter km para radianos (raio da Terra ~6378.1 km)
            ],
          },
        },
      });

      // Calcular distância exata e ordenar
      const cidadesComDistancia = cidades.map(cidade => {
        const [lonCidade, latCidade] = cidade.localizacao.coordinates;
        const distancia = calcularDistancia(lat, lon, latCidade, lonCidade);

        return {
          nome: cidade.nome,
          estado: cidade.estado || '',
          pais: cidade.pais || '',
          distancia_km: Math.round(distancia * 100) / 100,
          lat: latCidade,
          lon: lonCidade,
        };
      });

      // Ordenar por distância
      cidadesComDistancia.sort((a, b) => a.distancia_km - b.distancia_km);

      return cidadesComDistancia;
    } catch (error) {
      console.error('Erro ao buscar cidades próximas:', error.message);
      return [];
    }
  }

  /**
   * Salva uma cidade no MongoDB (evita duplicatas)
   */
  async salvarCidade(nome: string, estado: string, pais: string, lat: number, lon: number) {
    try {
      // Verificar se já existe
      const cidadeExistente = await this.cidadeModel.findOne({
        nome,
        estado: estado || '',
        pais: pais || '',
      });

      if (cidadeExistente) {
        return cidadeExistente;
      }

      // Criar nova cidade
      const cidade = new this.cidadeModel({
        nome,
        estado: estado || '',
        pais: pais || '',
        localizacao: {
          type: 'Point',
          coordinates: [lon, lat], // [longitude, latitude]
        },
      });

      await cidade.save();
      return cidade;
    } catch (error) {
      // Se erro for de duplicata (índice único), buscar a existente
      if (error.code === 11000) {
        return await this.cidadeModel.findOne({
          nome,
          estado: estado || '',
          pais: pais || '',
        });
      }
      console.error('Erro ao salvar cidade:', error.message);
      return null;
    }
  }

  /**
   * Salva múltiplas cidades (batch)
   */
  async salvarCidades(cidades: Array<{ nome: string; estado: string; pais: string; lat: number; lon: number }>) {
    const resultados = [];
    for (const cidade of cidades) {
      const resultado = await this.salvarCidade(
        cidade.nome,
        cidade.estado,
        cidade.pais,
        cidade.lat,
        cidade.lon,
      );
      if (resultado) {
        resultados.push(resultado);
      }
    }
    return resultados;
  }

  /**
   * Busca coordenadas por endereço/nome de cidade
   */
  async buscarCoordenadasPorEndereco(endereco: string) {
    try {
      const resultado = await this.googleMapsService.buscarPorEndereco(endereco);
      return resultado;
    } catch (error) {
      throw new Error(`Erro ao buscar endereço: ${error.message}`);
    }
  }

  /**
   * Obtém cidade atual (busca MongoDB primeiro, depois API)
   */
  async obterCidadeAtual(lat: number, lon: number) {
    // Tentar buscar no MongoDB primeiro
    const cidadeMongo = await this.buscarCidadePorCoordenadas(lat, lon, 1);
    if (cidadeMongo) {
      return { ...cidadeMongo, doMongoDB: true };
    }

    // Se não encontrou no MongoDB, consultar API
    const cidadeApi = await this.googleMapsService.obterCidadeAtual(lat, lon);

    // Salvar no MongoDB se encontrou cidade válida
    if (cidadeApi.cidade && cidadeApi.cidade !== 'Não encontrada') {
      await this.salvarCidade(
        cidadeApi.cidade,
        cidadeApi.estado,
        cidadeApi.pais,
        cidadeApi.coordenadas.lat,
        cidadeApi.coordenadas.lon,
      );
    }

    return { ...cidadeApi, doMongoDB: false };
  }

  /**
   * Obtém cidades vizinhas (busca MongoDB primeiro, depois API)
   */
  async obterCidadesVizinhas(lat: number, lon: number, raioKm: number, limit?: number, skip?: number) {
    // Tentar buscar no MongoDB primeiro
    // Se encontrar menos de 3 cidades, ainda consulta API para garantir completude
    const cidadesMongo = await this.buscarCidadesProximas(lat, lon, raioKm);
    if (cidadesMongo.length >= 3) {
      // Aplicar paginação
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

    // Se não encontrou no MongoDB ou encontrou poucas, consultar API
    const cidadesApi = await this.googleMapsService.obterCidadesVizinhas(lat, lon, raioKm);

    // Salvar novas cidades no MongoDB
    if (cidadesApi.length > 0) {
      await this.salvarCidades(cidadesApi);
    }

    // Combinar resultados do MongoDB e API, removendo duplicatas
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

    // Aplicar paginação
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

  /**
   * Lista todas as cidades salvas no MongoDB
   */
  async listarTodasCidades(limit?: number, skip?: number) {
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
    } catch (error) {
      console.error('Erro ao listar cidades:', error.message);
      throw new Error(`Erro ao listar cidades: ${error.message}`);
    }
  }

  /**
   * Busca locais em uma cidade usando Places API
   */
  async buscarLocaisPorCidade(query: string, city: string) {
    try {
      const locais = await this.googleMapsService.buscarLocaisPorCidade(query, city);
      return locais;
    } catch (error) {
      throw new Error(`Erro ao buscar locais: ${error.message}`);
    }
  }
}

