import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';
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
}

