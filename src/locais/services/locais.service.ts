import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Local, LocalDocument, TipoLocal } from '../schemas/local.schema';
import { CriarLocalDto } from '../dto/criar-local.dto';
import { AtualizarLocalDto } from '../dto/atualizar-local.dto';
import { ListarLocaisDto } from '../dto/listar-locais.dto';
import { GoogleMapsService } from '../../cidades/services/google-maps.service';
import { CidadesService } from '../../cidades/services/cidades.service';
import { Cidade, CidadeDocument } from '../../cidades/schemas/cidade.schema';
import { calcularDistancia } from '../../common/utils/calcular-distancia.util';

@Injectable()
export class LocaisService {
  constructor(
    @InjectModel(Local.name) private localModel: Model<LocalDocument>,
    @InjectModel(Cidade.name) private cidadeModel: Model<CidadeDocument>,
    private googleMapsService: GoogleMapsService,
    private cidadesService: CidadesService,
  ) {}

  /**
   * Cria um novo local de hospedagem
   */
  async criar(criarLocalDto: CriarLocalDto) {
    let lat: number;
    let lon: number;

    // Se coordenadas não foram fornecidas, buscar pelo endereço
    if (!criarLocalDto.lat || !criarLocalDto.lon) {
      if (!criarLocalDto.endereco) {
        throw new Error('É necessário fornecer coordenadas (lat/lon) ou um endereço');
      }

      // Buscar coordenadas pelo endereço usando Geocoding API
      const resultadoGeocode = await this.googleMapsService.buscarPorEndereco(criarLocalDto.endereco);
      lat = resultadoGeocode.coordenadas.lat;
      lon = resultadoGeocode.coordenadas.lon;
    } else {
      lat = criarLocalDto.lat;
      lon = criarLocalDto.lon;
    }

      // Tentar encontrar cidade próxima no MongoDB
      let cidadeId: Types.ObjectId | undefined;
      try {
        const cidade = await this.cidadesService.buscarCidadePorCoordenadas(lat, lon, 5);
        if (cidade && cidade.cidade && cidade.cidade !== 'Não encontrada') {
          // Buscar o ObjectId da cidade no banco
          const cidadeEncontrada = await this.cidadeModel.findOne({
            nome: cidade.cidade,
            estado: cidade.estado || '',
            pais: cidade.pais || '',
          });
          if (cidadeEncontrada) {
            cidadeId = cidadeEncontrada._id;
          }
        }
      } catch (error) {
        // Se não encontrar cidade, continua sem relacionar
        console.log('Cidade não encontrada para relacionar com o local');
      }

    // Criar o local
    const local = new this.localModel({
      tipo: criarLocalDto.tipo,
      nome: criarLocalDto.nome,
      descricao: criarLocalDto.descricao,
      endereco: criarLocalDto.endereco,
      localizacao: {
        type: 'Point',
        coordinates: [lon, lat], // [longitude, latitude]
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

  /**
   * Lista locais com filtros e paginação
   */
  async listar(listarLocaisDto: ListarLocaisDto) {
    const query: any = {};

    // Filtro por tipo
    if (listarLocaisDto.tipo) {
      query.tipo = listarLocaisDto.tipo;
    }

    // Filtro por preço
    if (listarLocaisDto.precoMin !== undefined || listarLocaisDto.precoMax !== undefined) {
      query.preco = {};
      if (listarLocaisDto.precoMin !== undefined) {
        query.preco.$gte = listarLocaisDto.precoMin;
      }
      if (listarLocaisDto.precoMax !== undefined) {
        query.preco.$lte = listarLocaisDto.precoMax;
      }
    }

    // Busca por proximidade geográfica
    let sortBy: any = { preco: 1 }; // Ordenação padrão por preço
    let calcularDistanciaPara: { lat: number; lon: number } | null = null;

    if (listarLocaisDto.lat && listarLocaisDto.lon && listarLocaisDto.raioKm) {
      const lat = listarLocaisDto.lat;
      const lon = listarLocaisDto.lon;
      const raioKm = listarLocaisDto.raioKm;

      query.localizacao = {
        $geoWithin: {
          $centerSphere: [
            [lon, lat], // [longitude, latitude]
            raioKm / 6378.1, // Converter km para radianos (raio da Terra ~6378.1 km)
          ],
        },
      };

      calcularDistanciaPara = { lat, lon };
      sortBy = { localizacao: 'asc' }; // Ordenar por proximidade
    }

    // Aplicar paginação
    const skip = listarLocaisDto.skip || 0;
    const limit = listarLocaisDto.limit || 20;

    // Executar query
    const locais = await this.localModel.find(query).skip(skip).limit(limit).sort(sortBy).exec();
    const total = await this.localModel.countDocuments(query);

    // Calcular distâncias se necessário
    let locaisComDistancia: any[] = locais.map(l => l.toObject());
    if (calcularDistanciaPara) {
      locaisComDistancia = locais.map(local => {
        const [lonLocal, latLocal] = local.localizacao.coordinates;
        const distancia = calcularDistancia(
          calcularDistanciaPara!.lat,
          calcularDistanciaPara!.lon,
          latLocal,
          lonLocal,
        );

        const localObj = local.toObject();
        return {
          ...localObj,
          distancia_km: Math.round(distancia * 100) / 100,
        };
      });

      // Ordenar por distância
      locaisComDistancia.sort((a: any, b: any) => a.distancia_km - b.distancia_km);
    }

    return {
      locais: locaisComDistancia,
      total,
      limit,
      skip,
    };
  }

  /**
   * Busca um local por ID
   */
  async buscarPorId(id: string) {
    const local = await this.localModel.findById(id).exec();
    if (!local) {
      throw new NotFoundException(`Local com ID ${id} não encontrado`);
    }
    return local;
  }

  /**
   * Atualiza um local existente
   */
  async atualizar(id: string, atualizarLocalDto: AtualizarLocalDto) {
    const local = await this.buscarPorId(id);

    // Se endereço ou coordenadas foram atualizados, recalcular coordenadas se necessário
    if (atualizarLocalDto.endereco || atualizarLocalDto.lat || atualizarLocalDto.lon) {
      let lat: number;
      let lon: number;

      if (atualizarLocalDto.lat && atualizarLocalDto.lon) {
        lat = atualizarLocalDto.lat;
        lon = atualizarLocalDto.lon;
      } else if (atualizarLocalDto.endereco) {
        const resultadoGeocode = await this.googleMapsService.buscarPorEndereco(atualizarLocalDto.endereco);
        lat = resultadoGeocode.coordenadas.lat;
        lon = resultadoGeocode.coordenadas.lon;
      } else {
        // Manter coordenadas existentes
        [lon, lat] = local.localizacao.coordinates;
      }

      // Atualizar localização
      atualizarLocalDto['localizacao'] = {
        type: 'Point',
        coordinates: [lon, lat],
      };

      // Tentar atualizar relacionamento com cidade
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
      } catch (error) {
        // Se não encontrar cidade, mantém o relacionamento existente ou remove
      }
    }

    // Atualizar campos
    Object.assign(local, atualizarLocalDto);
    await local.save();

    return local;
  }

  /**
   * Busca locais próximos a uma coordenada
   */
  async buscarProximos(lat: number, lon: number, raioKm: number, limit: number = 20) {
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

    // Calcular distâncias
    const locaisComDistancia = locais.map(local => {
      const [lonLocal, latLocal] = local.localizacao.coordinates;
      const distancia = calcularDistancia(lat, lon, latLocal, lonLocal);

      const localObj = local.toObject();
      return {
        ...localObj,
        distancia_km: Math.round(distancia * 100) / 100,
      };
    });

    // Ordenar por distância
    locaisComDistancia.sort((a: any, b: any) => a.distancia_km - b.distancia_km);

    return locaisComDistancia;
  }
}

