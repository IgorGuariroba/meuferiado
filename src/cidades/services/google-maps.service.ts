import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { calcularDistancia } from '../../common/utils/calcular-distancia.util';

@Injectable()
export class GoogleMapsService {
  private client: Client;
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
  }

  /**
   * Busca coordenadas por endereço/nome de cidade (Geocoding)
   */
  async buscarPorEndereco(endereco: string) {
    try {
      const response = await this.client.geocode({
        params: {
          address: endereco,
          key: this.apiKey,
          language: 'pt-BR' as any,
        },
      });

      if (!response.data.results?.length) {
        throw new Error('Endereço não encontrado');
      }

      const resultado = response.data.results[0];
      const geometry = (resultado.geometry || {}) as any;
      const location = geometry.location || {};

      if (!location.lat || !location.lng) {
        throw new Error('Coordenadas não encontradas para o endereço');
      }

      let cidade = '', estado = '', pais = '';

      for (const comp of resultado.address_components || []) {
        const tipos = (comp.types || []) as string[];

        if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
          cidade = comp.long_name;
        } else if (tipos.includes('administrative_area_level_1')) {
          estado = comp.short_name;
        } else if (tipos.includes('country')) {
          pais = comp.short_name;
        }
      }

      return {
        cidade: cidade || resultado.formatted_address || 'Não encontrada',
        estado,
        pais,
        endereco_completo: resultado.formatted_address,
        coordenadas: {
          lat: location.lat,
          lon: location.lng,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao buscar endereço: ${error.message}`);
    }
  }

  /**
   * Obtém informações da cidade atual via Geocoding
   */
  async obterCidadeAtual(lat: number, lon: number) {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng: lon },
          key: this.apiKey,
          language: 'pt-BR' as any,
        },
      });

      if (!response.data.results?.length) {
        return { cidade: 'Não encontrada', estado: '', pais: '', endereco_completo: '' };
      }

      const endereco = response.data.results[0];
      let cidade = '', estado = '', pais = '';

      for (const comp of endereco.address_components || []) {
        const tipos = (comp.types || []) as string[];

        if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
          cidade = comp.long_name;
        } else if (tipos.includes('administrative_area_level_1')) {
          estado = comp.short_name;
        } else if (tipos.includes('country')) {
          pais = comp.short_name;
        }
      }

      return {
        cidade: cidade || endereco.formatted_address || 'Não encontrada',
        estado,
        pais,
        endereco_completo: endereco.formatted_address,
        coordenadas: {
          lat: endereco.geometry?.location?.lat || lat,
          lon: endereco.geometry?.location?.lng || lon,
        },
      };
    } catch (error) {
      throw new Error(`Erro na geocodificação: ${error.message}`);
    }
  }

  /**
   * Busca cidades vizinhas usando Geocoding API
   */
  async obterCidadesVizinhas(lat: number, lon: number, raioKm: number) {
    const cidadesMap = new Map<string, any>();
    const pontosVerificados = new Set<string>();

    try {
      // Criar pontos em círculos concêntricos
      for (const raioAtual of [raioKm * 0.3, raioKm * 0.6, raioKm * 0.9, raioKm]) {
        const numPontosCirculo = Math.max(4, Math.floor(raioAtual / 5));
        const anguloPasso = 360 / numPontosCirculo;

        for (let i = 0; i < numPontosCirculo; i++) {
          const angulo = (i * anguloPasso) * Math.PI / 180;
          const latOffset = (raioAtual / 111.0) * Math.cos(angulo);
          const lonOffset = (raioAtual / 111.0) * Math.sin(angulo) / Math.cos(lat * Math.PI / 180);

          const latPonto = lat + latOffset;
          const lonPonto = lon + lonOffset;

          const pontoKey = `${Math.round(latPonto * 1000) / 1000},${Math.round(lonPonto * 1000) / 1000}`;
          if (pontosVerificados.has(pontoKey)) continue;
          pontosVerificados.add(pontoKey);

          try {
            const resultados = await this.client.reverseGeocode({
              params: {
                latlng: { lat: latPonto, lng: lonPonto },
                key: this.apiKey,
                language: 'pt-BR' as any,
              },
            });

            if (resultados.data.results && resultados.data.results.length > 0) {
              const endereco = resultados.data.results[0];
              let cidadeNome = '', estado = '', pais = '';

              for (const componente of endereco.address_components || []) {
                const tipos = (componente.types || []) as string[];

                if (tipos.includes('locality') || tipos.includes('administrative_area_level_2')) {
                  cidadeNome = componente.long_name || '';
                } else if (tipos.includes('administrative_area_level_1')) {
                  estado = componente.short_name || '';
                } else if (tipos.includes('country')) {
                  pais = componente.short_name || '';
                }
              }

              if (!cidadeNome) {
                const partes = (endereco.formatted_address || '').split(',');
                if (partes.length > 0) {
                  cidadeNome = partes[0].trim();
                }
              }

              const geometry = (endereco.geometry || {}) as any;
              const location = geometry.location || {};
              const latLugar = location.lat || latPonto;
              const lonLugar = location.lng || lonPonto;

              // Calcular distância usando função utilitária
              const distancia = calcularDistancia(lat, lon, latLugar, lonLugar);

              if (distancia <= raioKm && cidadeNome) {
                const nomeKey = cidadeNome.toLowerCase();
                if (!cidadesMap.has(nomeKey)) {
                  cidadesMap.set(nomeKey, {
                    nome: cidadeNome,
                    estado,
                    pais,
                    distancia_km: Math.round(distancia * 100) / 100,
                    lat: latLugar,
                    lon: lonLugar,
                  });
                }
              }
            }
          } catch (err) {
            // Ignorar erros em pontos específicos
            continue;
          }
        }
      }

      // Converter Map para array e ordenar por distância
      const cidades = Array.from(cidadesMap.values())
        .sort((a, b) => a.distancia_km - b.distancia_km);

      return cidades.slice(0, 20); // Limitar a 20 resultados
    } catch (error) {
      throw new Error(`Erro ao buscar cidades vizinhas: ${error.message}`);
    }
  }

  /**
   * Busca detalhes completos de um local usando Place Details API
   */
  async buscarDetalhesLocal(placeId: string) {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não configurada');
      }

      // O placeId já vem com o prefixo "places/" da API de busca
      const fullPlaceId = placeId.startsWith('places/') ? placeId : `places/${placeId}`;

      const response = await axios.get(
        `https://places.googleapis.com/v1/${fullPlaceId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,types,priceLevel,photos,nationalPhoneNumber,internationalPhoneNumber,websiteUri,googleMapsUri,regularOpeningHours,currentOpeningHours,reviews,addressComponents,businessStatus',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Busca locais em uma cidade usando Places API (New) Text Search
   * Usa a nova API: https://places.googleapis.com/v1/places:searchText
   * Busca detalhes completos de cada local encontrado
   */
  async buscarLocaisPorCidade(query: string, city: string) {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não configurada. Configure GOOGLE_MAPS_API_KEY no arquivo .env');
      }

      // Combinar query e cidade na busca
      const searchQuery = `${query} em ${city}`;

      // Usar a nova Places API (New) via POST
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: searchQuery,
          languageCode: 'pt-BR',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.priceLevel',
          },
        }
      );

      if (!response.data.places?.length) {
        return [];
      }

      // Buscar detalhes completos de cada local (com limite para não exceder quota)
      // Processar até 20 locais, mas com delay entre requisições para não exceder quota
      const maxLocais = Math.min(response.data.places.length, 20);

      const locaisComDetalhes = [];
      for (let i = 0; i < maxLocais; i++) {
        const place = response.data.places[i];
        const location = place.location || {};
        const placeId = place.id?.replace('places/', '') || null;

        // Buscar detalhes completos
        let detalhes = null;
        if (placeId) {
          try {
            detalhes = await this.buscarDetalhesLocal(place.id);
          } catch (error: any) {
            // Ignorar erro e continuar
          }

          // Delay de 200ms entre requisições para não exceder quota
          if (i < maxLocais - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Mapear dados básicos
        const localBasico = {
          nome: place.displayName?.text || 'Sem nome',
          endereco: place.formattedAddress || '',
          coordenadas: {
            lat: location.latitude || null,
            lon: location.longitude || null,
          },
          rating: place.rating || null,
          total_avaliacoes: place.userRatingCount || null,
          tipos: place.types || [],
          place_id: placeId,
          nivel_preco: place.priceLevel || null,
        };

        // Se encontrou detalhes, adicionar informações extras
        if (detalhes) {
            // Mapear photos
            const photosMapeadas = detalhes.photos?.map((photo: any) => ({
              photo_reference: photo.name || null, // name contém o ID completo da foto (ex: "places/ChIJ.../photos/...")
              width: photo.widthPx || null,
              height: photo.heightPx || null,
            })) || [];

            // Mapear reviews
            const reviewsMapeadas = detalhes.reviews?.map((review: any) => ({
              autor: review.authorAttribution?.displayName || 'Anônimo',
              rating: review.rating || null,
              texto: review.text?.text || '',
              data: review.publishTime || null,
            })) || [];

            const localComDetalhes = {
              ...localBasico,
              // Fotos
              photos: photosMapeadas,
              // Contato
              formatted_phone_number: detalhes.nationalPhoneNumber || detalhes.internationalPhoneNumber || null,
              website: detalhes.websiteUri || null,
              url: detalhes.googleMapsUri || null,
              // Horários
              opening_hours: detalhes.regularOpeningHours?.weekdayDescriptions || detalhes.currentOpeningHours?.weekdayDescriptions || null,
              current_opening_hours: detalhes.currentOpeningHours ? {
                weekday_descriptions: detalhes.currentOpeningHours.weekdayDescriptions || [],
                open_now: detalhes.currentOpeningHours.openNow || false,
                periods: detalhes.currentOpeningHours.periods || [],
              } : null,
              open_now: detalhes.currentOpeningHours?.openNow || detalhes.regularOpeningHours?.openNow || false,
              // Avaliações
              reviews: reviewsMapeadas,
              // Localização detalhada
              formatted_address: detalhes.formattedAddress || place.formattedAddress || '',
              address_components: detalhes.addressComponents?.map((comp: any) => ({
                tipo: comp.types || [],
                nome_longo: comp.longText || null,
                nome_curto: comp.shortText || null,
                linguagem: comp.languageCode || null,
              })) || [],
              // Status do negócio
              business_status: detalhes.businessStatus || null,
          };

          locaisComDetalhes.push(localComDetalhes);
        } else {
          locaisComDetalhes.push(localBasico);
        }
      }

      return locaisComDetalhes;
    } catch (error: any) {
      // Tratamento específico para erros da API
      if (error.response?.status === 403) {
        throw new Error(
          'Erro 403: Places API (New) não está habilitada ou a chave de API não tem permissão. ' +
          'Verifique no Google Cloud Console se a Places API (New) está habilitada e se a chave tem as permissões corretas. ' +
          'A nova API requer habilitar "Places API (New)" especificamente.'
        );
      }
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error?.message || error.message;
        throw new Error(`Erro na requisição: ${errorMessage}`);
      }
      throw new Error(`Erro ao buscar locais: ${error.message}`);
    }
  }
}

