import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cidade, CidadeDocument } from '../schemas/cidade.schema';
import { Local, LocalDocument } from '../../locais/schemas/local.schema';
import { TermoBusca, TermoBuscaDocument } from '../schemas/termo-busca.schema';
import { GoogleMapsService } from './google-maps.service';
import { calcularDistancia } from '../../common/utils/calcular-distancia.util';
import { mapearTipoLocal, estimarPrecoPorPriceLevel } from '../utils/mapear-tipo-local.util';

@Injectable()
export class CidadesService {
  constructor(
    @InjectModel(Cidade.name) private cidadeModel: Model<CidadeDocument>,
    @InjectModel(Local.name) private localModel: Model<LocalDocument>,
    @InjectModel(TermoBusca.name) private termoBuscaModel: Model<TermoBuscaDocument>,
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
      return null;
    }
  }

  /**
   * Busca cidades próximas dentro de um raio (em km)
   * Usa consulta geográfica do MongoDB ($geoWithin com $centerSphere)
   * que considera o raio especificado para buscar cidades dentro de um círculo
   * @param lat - Latitude do ponto central
   * @param lon - Longitude do ponto central
   * @param raioKm - Raio em quilômetros para buscar cidades
   * @returns Array de cidades ordenadas por distância
   */
  async buscarCidadesProximas(lat: number, lon: number, raioKm: number) {
    try {
      // $geoWithin com $centerSphere busca todas as cidades dentro de um círculo
      // O raio é convertido de km para radianos (raio da Terra ~6378.1 km)
      const cidades = await this.cidadeModel.find({
        localizacao: {
          $geoWithin: {
            $centerSphere: [
              [lon, lat], // [longitude, latitude] - ordem do MongoDB
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
   * Tenta buscar no MongoDB primeiro para evitar chamadas desnecessárias à API
   * @param endereco - Endereço ou nome da cidade (ex: "São Paulo, SP")
   * @param coordenadasValidadas - Opcional: coordenadas para validar se a cidade encontrada está próxima
   * @param raioValidacaoKm - Raio em km para validar proximidade (padrão: 5km)
   */
  async buscarCoordenadasPorEndereco(
    endereco: string,
    coordenadasValidadas?: { lat: number; lon: number },
    raioValidacaoKm: number = 5,
  ) {
    try {
      // Tentar extrair nome da cidade e estado do endereço
      // Formatos comuns: "São Paulo, SP", "São Paulo, SP, Brasil", "São Paulo"
      const partes = endereco.split(',').map(p => p.trim());
      const nomeCidade = partes[0];
      const estado = partes.length > 1 ? partes[1] : null;

      // Tentar buscar no MongoDB primeiro
      const queryCidade: any = {
        nome: { $regex: new RegExp(`^${nomeCidade}$`, 'i') },
      };

      if (estado && estado.length <= 3) {
        // Se parece ser um estado (2-3 letras), adicionar à query
        queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
      }

      const cidadeMongo = await this.cidadeModel.findOne(queryCidade);

      if (cidadeMongo && cidadeMongo.localizacao) {
        const [lon, lat] = cidadeMongo.localizacao.coordinates;

        // Se foram fornecidas coordenadas para validação, verificar se a cidade está próxima
        if (coordenadasValidadas) {
          const distancia = calcularDistancia(
            coordenadasValidadas.lat,
            coordenadasValidadas.lon,
            lat,
            lon,
          );

          // Se a cidade encontrada está muito longe das coordenadas fornecidas, não usar do MongoDB
          if (distancia > raioValidacaoKm) {
            // Continuar para buscar na API
          } else {
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
        } else {
          // Se não há coordenadas para validar, usar a cidade do MongoDB
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

      // Se não encontrou no MongoDB, consultar API
      const resultado = await this.googleMapsService.buscarPorEndereco(endereco);

      // Salvar no MongoDB se encontrou cidade válida
      if (resultado.cidade && resultado.cidade !== 'Não encontrada' && resultado.coordenadas) {
        await this.salvarCidade(
          resultado.cidade,
          resultado.estado || '',
          resultado.pais || 'BR',
          resultado.coordenadas.lat,
          resultado.coordenadas.lon,
        );
      }

      return {
        ...resultado,
        doMongoDB: false,
      };
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
   * O raio (raioKm) é usado para buscar cidades dentro de um círculo geográfico
   * a partir das coordenadas fornecidas (lat, lon)
   * @param lat - Latitude do ponto central
   * @param lon - Longitude do ponto central
   * @param raioKm - Raio em quilômetros para buscar cidades vizinhas
   * @param limit - Limite de resultados para paginação
   * @param skip - Número de resultados para pular na paginação
   */
  async obterCidadesVizinhas(lat: number, lon: number, raioKm: number, limit?: number, skip?: number) {
    // Tentar buscar no MongoDB primeiro usando o raio especificado
    // O método buscarCidadesProximas usa $geoWithin com $centerSphere que considera o raioKm
    const cidadesMongo = await this.buscarCidadesProximas(lat, lon, raioKm);

    // Verificar se encontrou cidades suficientes E se elas estão próximas do limite do raio
    if (cidadesMongo.length >= 3) {
      // Encontrar a cidade mais distante
      const cidadeMaisDistante = cidadesMongo[cidadesMongo.length - 1];
      const distanciaMaxima = cidadeMaisDistante?.distancia_km || 0;

      // Se a cidade mais distante está muito longe do limite do raio solicitado
      // (ex: raio é 50km mas a cidade mais distante está a 30km), consultar API
      // para garantir que temos todas as cidades no raio solicitado
      // Usamos 80% do raio como threshold (se a cidade mais distante está a menos de 80% do raio, pode estar faltando cidades)
      const threshold = raioKm * 0.8;

      if (distanciaMaxima < threshold) {
        // Cidades estão muito próximas do centro, pode estar faltando cidades no limite do raio
        // Consultar API para garantir completude
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
          doMongoDB: false, // Combinou MongoDB + API
        };
      } else {
        // Cidades estão próximas do limite do raio, provavelmente temos todas as cidades
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
      throw new Error(`Erro ao listar cidades: ${error.message}`);
    }
  }

  /**
   * Salva um local no MongoDB se ainda não existir (evita duplicatas por place_id)
   */
  async salvarLocalSeNaoExistir(
    localData: any,
    tipoQuery: string,
    city: string,
  ) {
    try {
      // Se não tem place_id, não podemos verificar duplicata de forma confiável
      if (!localData.place_id) {
        return null;
      }

      // Validar campos obrigatórios
      if (!localData.nome || !localData.nome.trim()) {
        return null;
      }

      if (!localData.endereco && !localData.formatted_address) {
        return null;
      }

      if (!localData.coordenadas || !localData.coordenadas.lat || !localData.coordenadas.lon) {
        return null;
      }

      // Verificar se já existe pelo place_id (incluindo excluídos)
      const localExistente = await this.localModel.findOne({
        place_id: localData.place_id,
      });

      if (localExistente) {
        // Se o local foi excluído (soft delete), não atualizar nem restaurar
        // O usuário excluiu por um motivo, então não devemos restaurar automaticamente
        // O deletedAt deve permanecer inalterado
        if (localExistente.deletedAt) {
          return null; // Retornar null para indicar que não deve ser salvo/retornado
          // O local permanece com deletedAt inalterado no banco de dados
        }

        // Verificar se o local não tem cidade relacionada e tentar atualizar
        let precisaAtualizarCidade = false;
        if (!localExistente.cidade) {
          // Buscar cidade relacionada
          let cidadeId: Types.ObjectId | undefined;
          try {
            // Primeiro, tentar buscar por coordenadas
            const cidade = await this.buscarCidadePorCoordenadas(
              localData.coordenadas.lat,
              localData.coordenadas.lon,
              5,
            );
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

            // Se não encontrou por coordenadas, tentar buscar pelo nome da cidade passado como parâmetro
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
          } catch (error) {
            // Se não encontrar cidade, continua sem relacionar
          }
        }

        // Adicionar categoria baseada na query (sem duplicatas)
        let precisaAtualizarCategoria = false;
        if (tipoQuery && tipoQuery.trim()) {
          const categoriaNormalizada = tipoQuery.trim().toLowerCase();
          const categoriasExistentes = localExistente.categorias || [];
          if (!categoriasExistentes.includes(categoriaNormalizada)) {
            localExistente.categorias = [...categoriasExistentes, categoriaNormalizada];
            precisaAtualizarCategoria = true;
          }
        }

        // Verificar se há novos detalhes para atualizar
        const temPhotosNovos = localData.photos?.length > 0;
        const temReviewsNovos = localData.reviews?.length > 0;
        const temTelefoneNovo = !!localData.formatted_phone_number;
        const temWebsiteNovo = !!localData.website;
        const temDetalhesNovos = temPhotosNovos || temReviewsNovos || temTelefoneNovo || temWebsiteNovo;

        // Verificar se os detalhes atuais estão vazios ou incompletos
        const photosVazios = !localExistente.photos || localExistente.photos.length === 0;
        const reviewsVazios = !localExistente.reviews || localExistente.reviews.length === 0;
        const telefoneVazio = !localExistente.formatted_phone_number;
        const websiteVazio = !localExistente.website;

        const precisaAtualizarDetalhes = temDetalhesNovos && (photosVazios || reviewsVazios || telefoneVazio || websiteVazio);
        const precisaAtualizar = precisaAtualizarCidade || precisaAtualizarCategoria || precisaAtualizarDetalhes;

        if (precisaAtualizar) {
          // Atualizar campos detalhados (sempre que houver novos dados)
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
          if (localData.url) localExistente.url = localData.url;
          if (localData.opening_hours) localExistente.opening_hours = localData.opening_hours;
          if (localData.current_opening_hours) localExistente.current_opening_hours = localData.current_opening_hours;
          if (localData.open_now !== undefined) localExistente.open_now = localData.open_now;
          if (localData.formatted_address) localExistente.formatted_address = localData.formatted_address;
          if (localData.address_components?.length) localExistente.address_components = localData.address_components;
          if (localData.business_status) localExistente.business_status = localData.business_status;

          await localExistente.save();
          return localExistente;
        }

        return localExistente;
      }

      // Buscar cidade relacionada
      let cidadeId: Types.ObjectId | undefined;
      try {
        // Primeiro, tentar buscar por coordenadas
        const cidade = await this.buscarCidadePorCoordenadas(
          localData.coordenadas.lat,
          localData.coordenadas.lon,
          5,
        );
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

        // Se não encontrou por coordenadas, tentar buscar pelo nome da cidade passado como parâmetro
        if (!cidadeId && city) {
          const cidadePorNome = await this.cidadeModel.findOne({
            nome: { $regex: new RegExp(`^${city}$`, 'i') },
          });
          if (cidadePorNome) {
            cidadeId = cidadePorNome._id;
          }
        }
      } catch (error) {
        // Se não encontrar cidade, continua sem relacionar
      }

      // Mapear tipo da query para o enum do schema
      const tipoLocal = mapearTipoLocal(tipoQuery);

      // Estimar preço baseado no priceLevel
      const preco = estimarPrecoPorPriceLevel(localData.nivel_preco);

      // Criar novo local com todos os campos disponíveis
      const endereco = localData.endereco || localData.formatted_address || '';

      if (!endereco.trim()) {
        return null;
      }

      // Preparar categorias para novo local
      const categorias = tipoQuery && tipoQuery.trim()
        ? [tipoQuery.trim().toLowerCase()]
        : [];

      const local = new this.localModel({
        tipo: tipoLocal,
        nome: localData.nome.trim(),
        endereco: endereco.trim(),
        localizacao: {
          type: 'Point',
          coordinates: [localData.coordenadas.lon, localData.coordenadas.lat], // [longitude, latitude]
        },
        preco: preco,
        avaliacao: localData.rating || undefined,
        tipos: localData.tipos || [],
        categorias: categorias,
        total_avaliacoes: localData.total_avaliacoes || 0,
        place_id: localData.place_id,
        cidade: cidadeId,
        descricao: `Local encontrado em ${city}`,
        // Fotos
        photos: localData.photos || localData.fotos || [],
        // Contato
        formatted_phone_number: localData.formatted_phone_number || localData.telefone_formatado || undefined,
        website: localData.website || undefined,
        url: localData.url || localData.url_google_maps || undefined,
        // Atualizar contato básico se disponível
        contato: (localData.formatted_phone_number || localData.telefone_formatado) ? {
          telefone: localData.formatted_phone_number || localData.telefone_formatado,
          email: undefined,
        } : undefined,
        // Horários
        opening_hours: localData.opening_hours || undefined,
        current_opening_hours: localData.current_opening_hours || undefined,
        open_now: localData.open_now || false,
        // Avaliações
        reviews: localData.reviews || [],
        // Localização detalhada
        formatted_address: localData.formatted_address || localData.endereco || undefined,
        address_components: localData.address_components || [],
        // Status do negócio
        business_status: localData.business_status || undefined,
      });

      const localSalvo = await local.save();
      return localSalvo;
    } catch (error: any) {
      // Se erro for de duplicata (índice único), buscar o existente
      if (error.code === 11000) {
        const existente = await this.localModel.findOne({
          place_id: localData.place_id,
          deletedAt: null, // Apenas locais não deletados
        });
        if (existente) {
          return existente;
        }
      }

      // Re-lançar o erro para que seja capturado pelo Promise.allSettled
      throw error;
    }
  }

  /**
   * Busca locais em uma cidade usando Places API e salva no MongoDB
   * Sempre busca na API do Google e retorna todos os resultados encontrados
   */
  async buscarLocaisPorCidade(query: string, city: string) {
    try {
      // Buscar coordenadas da cidade para aplicar filtro geográfico
      let coordenadasCidade: { lat: number; lon: number } | null = null;
      let estadoCidade: string | null = null;
      try {
        const enderecoInfo = await this.buscarCoordenadasPorEndereco(city);
        if (enderecoInfo && enderecoInfo.coordenadas) {
          coordenadasCidade = enderecoInfo.coordenadas;
          estadoCidade = enderecoInfo.estado || null;
        }
      } catch (error) {
        // Se não conseguir obter coordenadas, continuar sem filtro geográfico
      }

      // Buscar dados básicos na API do Google com filtro geográfico
      const locaisBasicos = await this.googleMapsService.buscarLocaisBasicosPorCidade(
        query,
        city,
        coordenadasCidade,
      );

      if (locaisBasicos.length === 0) {
        return [];
      }

      // Filtrar apenas locais com place_id válido
      let locaisComPlaceId = locaisBasicos.filter(local => local.place_id);

      // Filtrar locais por proximidade geográfica se tivermos coordenadas da cidade
      if (coordenadasCidade) {
        const raioMaximoKm = 50; // Raio máximo de 50km da cidade

        locaisComPlaceId = locaisComPlaceId.filter(local => {
          if (!local.coordenadas || !local.coordenadas.lat || !local.coordenadas.lon) {
            return false;
          }

          const distancia = calcularDistancia(
            coordenadasCidade.lat,
            coordenadasCidade.lon,
            local.coordenadas.lat,
            local.coordenadas.lon,
          );

          return distancia <= raioMaximoKm;
        });
      }

      // Filtrar por estado se tivermos essa informação
      if (estadoCidade && locaisComPlaceId.length > 0) {
        // Verificar se o endereço do local contém o estado correto
        locaisComPlaceId = locaisComPlaceId.filter(local => {
          if (!local.endereco && !local.formatted_address) {
            return true; // Manter se não tiver endereço para verificar depois
          }

          const enderecoCompleto = (local.endereco || local.formatted_address || '').toUpperCase();
          const estadoUpper = estadoCidade.toUpperCase();

          // Verificar se o endereço contém o estado correto
          return enderecoCompleto.includes(estadoUpper) ||
                 enderecoCompleto.includes(estadoUpper.replace('SP', 'SÃO PAULO'));
        });
      }

      if (locaisComPlaceId.length === 0) {
        return [];
      }

      // Buscar detalhes completos de todos os locais encontrados
      const locais = await this.googleMapsService.buscarDetalhesLocais(locaisComPlaceId);

      // Salvar todos os locais no MongoDB (o método salvarLocalSeNaoExistir trata duplicatas)
      const locaisSalvos = await Promise.allSettled(
        locais.map(local =>
          this.salvarLocalSeNaoExistir(local, query, city),
        ),
      );

      // Processar resultados
      const salvosComSucesso = [];
      const errosSalvamento = [];

      locaisSalvos.forEach((result, index) => {
        const local = locais[index];
        if (result.status === 'fulfilled' && result.value !== null) {
          salvosComSucesso.push(result.value);
        } else if (result.status === 'rejected') {
          const erro = {
            nome: local?.nome || 'Desconhecido',
            place_id: local?.place_id || 'N/A',
            erro: result.reason?.message || String(result.reason),
            stack: result.reason?.stack,
          };
          errosSalvamento.push(erro);
        } else if (result.status === 'fulfilled' && result.value === null) {
          const erro = {
            nome: local?.nome || 'Desconhecido',
            place_id: local?.place_id || 'N/A',
            erro: 'Local retornou null (pode não ter passado na validação ou já estar deletado)',
          };
          errosSalvamento.push(erro);
        }
      });

      // Formatar todos os locais encontrados para o mesmo formato da rota de locais salvos
      const locaisFormatados = locais.map(local => {
        // Buscar o local salvo correspondente para pegar o ID e outros campos do MongoDB
        const localSalvo = salvosComSucesso.find(l => l.place_id === local.place_id);

        return {
          id: localSalvo?._id?.toString() || null,
          tipo: localSalvo?.tipo || mapearTipoLocal(query),
          nome: local.nome,
          descricao: localSalvo?.descricao || `Local encontrado em ${city}`,
          endereco: local.endereco,
          formatted_address: local.formatted_address || local.endereco,
          coordenadas: local.coordenadas,
          preco: localSalvo?.preco || estimarPrecoPorPriceLevel(local.nivel_preco),
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

      // Se houver erros, adicionar informação na resposta (sem quebrar a API)
      if (errosSalvamento.length > 0) {
        // Adicionar informação sobre erros nos locais formatados (como metadado)
        locaisFormatados.forEach((localFormatado) => {
          const erro = errosSalvamento.find(e => e.place_id === localFormatado.place_id);
          if (erro) {
            // Adicionar flag indicando que não foi salvo
            (localFormatado as any).erroSalvamento = erro.erro;
            (localFormatado as any).salvo = false;
          } else {
            (localFormatado as any).salvo = true;
          }
        });
      } else {
        // Marcar todos como salvos
        locaisFormatados.forEach(local => {
          (local as any).salvo = true;
        });
      }

      return locaisFormatados;
    } catch (error) {
      throw new Error(`Erro ao buscar locais: ${error.message}`);
    }
  }

  /**
   * Busca locais salvos no MongoDB por nome da cidade
   */
  async buscarLocaisSalvosPorCidade(city: string, estado?: string, limit: number = 50, skip: number = 0, nome?: string) {
    try {
      // Validar limit
      const limitFinal = Math.min(Math.max(1, limit || 50), 100);
      const skipFinal = Math.max(0, skip || 0);

      // Buscar cidade no MongoDB
      const queryCidade: any = {
        nome: { $regex: new RegExp(`^${city}$`, 'i') }, // Case-insensitive exact match
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

      // Buscar locais relacionados à cidade (apenas não deletados)
      const queryLocais: any = {
        cidade: cidade._id,
        deletedAt: null, // Apenas locais não deletados
      };

      // Adicionar filtro por nome se fornecido
      if (nome) {
        queryLocais.nome = { $regex: new RegExp(nome, 'i') }; // Busca parcial case-insensitive
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

      // Transformar para formato de resposta (mesmo formato da API)
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
    } catch (error) {
      throw new Error(`Erro ao buscar locais salvos: ${error.message}`);
    }
  }

  /**
   * Atualiza locais existentes que não têm detalhes completos
   */
  async atualizarLocaisSemDetalhes(city: string, estado?: string, limit: number = 10) {
    try {
      // Buscar cidade
      const queryCidade: any = {
        nome: { $regex: new RegExp(`^${city}$`, 'i') },
      };
      if (estado) {
        queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
      }

      const cidade = await this.cidadeModel.findOne(queryCidade);
      if (!cidade) {
        throw new Error(`Cidade não encontrada: ${city}`);
      }

      // Buscar locais que não têm detalhes completos (apenas não deletados)
      const queryLocais: any = {
        cidade: cidade._id,
        deletedAt: null, // Apenas locais não deletados
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
          // Buscar detalhes completos
          const detalhes = await this.googleMapsService.buscarDetalhesLocal(`places/${local.place_id}`);

          if (!detalhes) {
            continue;
          }

          // Atualizar campos
          let atualizouAlgo = false;

          if (detalhes.photos?.length > 0 && (!local.photos || local.photos.length === 0)) {
            local.photos = detalhes.photos.map((photo: any) => ({
              photo_reference: photo.name || null,
              width: photo.widthPx || null,
              height: photo.heightPx || null,
            }));
            atualizouAlgo = true;
          }

          if (detalhes.reviews?.length > 0 && (!local.reviews || local.reviews.length === 0)) {
            local.reviews = detalhes.reviews.map((review: any) => ({
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
            local.address_components = detalhes.addressComponents.map((comp: any) => ({
              tipo: comp.types || [],
              nome_longo: comp.longText || null,
              nome_curto: comp.shortText || null,
              linguagem: comp.languageCode || null,
            }));
          }

          if (detalhes.businessStatus && !local.business_status) {
            local.business_status = detalhes.businessStatus;
          }

          // Atualizar tipos e total_avaliacoes se disponíveis
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
          } else {
            resultados.locais.push({
              nome: local.nome,
              place_id: local.place_id,
              atualizado: false,
              motivo: 'API não retornou photos/reviews/telefone/website',
            });
          }

          // Delay entre atualizações
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          resultados.erros++;
        }
      }

      return resultados;
    } catch (error) {
      throw new Error(`Erro ao atualizar locais: ${error.message}`);
    }
  }

  /**
   * Exclui locais salvos no MongoDB (soft delete)
   */
  async excluirLocaisSalvos(city: string, estado?: string, placeId?: string) {
    try {
      // Buscar cidade
      const queryCidade: any = {
        nome: { $regex: new RegExp(`^${city}$`, 'i') },
      };
      if (estado) {
        queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
      }

      const cidade = await this.cidadeModel.findOne(queryCidade);
      if (!cidade) {
        throw new Error(`Cidade não encontrada: ${city}`);
      }

      // Se placeId foi fornecido, fazer soft delete apenas desse local
      if (placeId) {
        const local = await this.localModel.findOneAndUpdate(
          {
            place_id: placeId,
            cidade: cidade._id,
            deletedAt: null, // Apenas locais não deletados
          },
          {
            $set: { deletedAt: new Date() },
          },
          {
            new: true, // Retorna o documento atualizado
          }
        );

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

      // Fazer soft delete de todos os locais da cidade (apenas os não deletados)
      const resultado = await this.localModel.updateMany(
        {
          cidade: cidade._id,
          deletedAt: null, // Apenas locais não deletados
        },
        {
          $set: { deletedAt: new Date() },
        }
      );

      return {
        excluidos: resultado.modifiedCount || 0,
        cidade: {
          nome: cidade.nome,
          estado: cidade.estado,
          pais: cidade.pais,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao excluir locais: ${error.message}`);
    }
  }

  /**
   * Restaura locais excluídos no MongoDB (remove soft delete)
   */
  async restaurarLocaisSalvos(city: string, estado?: string, placeId?: string) {
    try {
      // Buscar cidade
      const queryCidade: any = {
        nome: { $regex: new RegExp(`^${city}$`, 'i') },
      };
      if (estado) {
        queryCidade.estado = { $regex: new RegExp(`^${estado}$`, 'i') };
      }

      const cidade = await this.cidadeModel.findOne(queryCidade);
      if (!cidade) {
        throw new Error(`Cidade não encontrada: ${city}`);
      }

      // Se placeId foi fornecido, restaurar apenas esse local
      if (placeId) {
        const local = await this.localModel.findOneAndUpdate(
          {
            place_id: placeId,
            cidade: cidade._id,
            deletedAt: { $ne: null }, // Apenas locais deletados
          },
          {
            $set: { deletedAt: null }, // Restaura o local (remove soft delete)
          },
          {
            new: true, // Retorna o documento atualizado
          }
        );

        if (!local) {
          throw new Error(`Local com place_id ${placeId} não encontrado na cidade ${city} ou não foi excluído`);
        }

        return {
          restaurados: 1,
          local: {
            nome: local.nome,
            place_id: local.place_id,
          },
        };
      }

      // Restaurar todos os locais excluídos da cidade
      const resultado = await this.localModel.updateMany(
        {
          cidade: cidade._id,
          deletedAt: { $ne: null }, // Apenas locais deletados
        },
        {
          $set: { deletedAt: null }, // Restaura os locais (remove soft delete)
        }
      );

      return {
        restaurados: resultado.modifiedCount || 0,
        cidade: {
          nome: cidade.nome,
          estado: cidade.estado,
          pais: cidade.pais,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao restaurar locais: ${error.message}`);
    }
  }

  /**
   * Gera URL para visualizar foto do Google Places
   */
  gerarUrlFoto(photoReference: string, maxWidth: number = 800, maxHeight: number = 600): string {
    return this.googleMapsService.gerarUrlFoto(photoReference, maxWidth, maxHeight);
  }

  /**
   * Busca locais excluídos (soft delete) por cidade
   */
  async buscarLocaisExcluidos(city: string, estado?: string, limit: number = 50, skip: number = 0) {
    try {
      // Validar limit
      const limitFinal = Math.min(Math.max(1, limit || 50), 100);
      const skipFinal = Math.max(0, skip || 0);

      // Buscar cidade no MongoDB
      const queryCidade: any = {
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

      // Buscar apenas locais excluídos (com deletedAt preenchido)
      const queryLocais: any = {
        cidade: cidade._id,
        deletedAt: { $ne: null }, // Apenas locais com deletedAt preenchido
      };

      const [locais, total] = await Promise.all([
        this.localModel
          .find(queryLocais)
          .limit(limitFinal)
          .skip(skipFinal)
          .sort({ deletedAt: -1 }) // Mais recentes primeiro
          .lean()
          .exec(),
        this.localModel.countDocuments(queryLocais),
      ]);

      // Formatar para o mesmo formato da rota de locais salvos
      const locaisFormatados = locais.map((local: any) => ({
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
    } catch (error) {
      throw new Error(`Erro ao buscar locais excluídos: ${error.message}`);
    }
  }

  /**
   * Lista todos os termos de busca
   */
  async listarTermosBusca(ativo?: boolean) {
    try {
      const query: any = {};
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
    } catch (error) {
      throw new Error(`Erro ao listar termos de busca: ${error.message}`);
    }
  }

  /**
   * Adiciona um novo termo de busca
   */
  async criarTermoBusca(termo: string, descricao?: string, ativo: boolean = true) {
    try {
      const termoNormalizado = termo.toLowerCase().trim();

      // Verificar se já existe
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
    } catch (error) {
      if (error.message.includes('já existe')) {
        throw error;
      }
      throw new Error(`Erro ao criar termo de busca: ${error.message}`);
    }
  }

  /**
   * Exclui um termo de busca
   */
  async excluirTermoBusca(termo: string) {
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
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        throw error;
      }
      throw new Error(`Erro ao excluir termo de busca: ${error.message}`);
    }
  }
}

