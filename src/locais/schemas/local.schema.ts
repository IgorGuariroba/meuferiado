import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LocalDocument = Local & Document;

export enum TipoLocal {
  CASA_PRAIA = 'casa_praia',
  CHALE = 'chale',
  POUSADA = 'pousada',
  HOTEL_FAZENDA = 'hotel_fazenda',
  CABANA = 'cabana',
  RESORT = 'resort',
  ALUGUEL_TEMPORADA = 'aluguel_temporada',
}

@Schema({ timestamps: false })
export class Contato {
  @Prop({ required: false, trim: true })
  telefone?: string;

  @Prop({ required: false, trim: true })
  email?: string;
}

@Schema({ timestamps: false })
export class Local {
  @Prop({
    type: String,
    enum: Object.values(TipoLocal),
    required: true,
  })
  tipo: TipoLocal;

  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ required: false, trim: true })
  descricao?: string;

  @Prop({ required: true, trim: true })
  endereco: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  localizacao: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };

  @Prop({ required: false, min: 0, default: 0 })
  preco?: number;

  @Prop({ type: [String], default: [] })
  imagens: string[];

  @Prop({
    type: {
      telefone: String,
      email: String,
    },
    required: false,
  })
  contato?: Contato;

  @Prop({ type: [String], default: [] })
  comodidades: string[];

  @Prop({ required: false, min: 0, max: 5 })
  avaliacao?: number;

  @Prop({ type: [String], default: [] })
  tipos?: string[]; // Tipos do Google Places (ex: ['lodging', 'point_of_interest'])

  @Prop({ type: [String], default: [] })
  categorias?: string[]; // Categorias baseadas nas queries de busca (ex: ['abrigo de montanha', 'camping'])

  @Prop({ required: false, default: 0 })
  total_avaliacoes?: number; // Total de avaliações (userRatingCount)

  @Prop({ type: Types.ObjectId, ref: 'Cidade', required: false })
  cidade?: Types.ObjectId;

  @Prop({ required: false, unique: true, sparse: true, trim: true })
  place_id?: string;

  // Fotos do Google Places
  @Prop({
    type: [{
      photo_reference: String,
      width: Number,
      height: Number,
    }],
    default: [],
  })
  photos?: Array<{
    photo_reference?: string;
    width?: number;
    height?: number;
  }>;

  // Contato
  @Prop({ required: false, trim: true })
  formatted_phone_number?: string;

  @Prop({ required: false, trim: true })
  website?: string;

  @Prop({ required: false, trim: true })
  url?: string; // Link do Google Maps

  // Horários
  @Prop({ type: [String], default: [] })
  opening_hours?: string[];

  @Prop({
    type: {
      weekday_descriptions: [String],
      open_now: Boolean,
      periods: [{
        open: {
          day: Number,
          time: String,
        },
        close: {
          day: Number,
          time: String,
        },
      }],
    },
    required: false,
  })
  current_opening_hours?: {
    weekday_descriptions?: string[];
    open_now?: boolean;
    periods?: Array<{
      open?: { day?: number; time?: string };
      close?: { day?: number; time?: string };
    }>;
  };

  @Prop({ required: false, default: false })
  open_now?: boolean;

  // Avaliações
  @Prop({
    type: [{
      autor: String,
      rating: Number,
      texto: String,
      data: String,
    }],
    default: [],
  })
  reviews?: Array<{
    autor?: string;
    rating?: number;
    texto?: string;
    data?: string;
  }>;

  // Localização detalhada
  @Prop({ required: false, trim: true })
  formatted_address?: string;

  @Prop({
    type: [{
      tipo: [String],
      nome_longo: String,
      nome_curto: String,
      linguagem: String,
    }],
    default: [],
  })
  address_components?: Array<{
    tipo?: string[];
    nome_longo?: string;
    nome_curto?: string;
    linguagem?: string;
  }>;

  // Status do negócio
  @Prop({ required: false, trim: true })
  business_status?: string;

  @Prop({ default: Date.now })
  criadoEm: Date;

  @Prop({ default: Date.now })
  atualizadoEm: Date;

  @Prop({ required: false })
  deletedAt?: Date;
}

export const LocalSchema = SchemaFactory.createForClass(Local);

// Índice geográfico 2dsphere para queries de proximidade
LocalSchema.index({ localizacao: '2dsphere' });

// Índices para busca rápida
LocalSchema.index({ tipo: 1 });
LocalSchema.index({ preco: 1 });
LocalSchema.index({ cidade: 1 });
LocalSchema.index({ place_id: 1 }, { unique: true, sparse: true });

// Índice composto para busca por tipo + localização
LocalSchema.index({ tipo: 1, localizacao: '2dsphere' });

// Índice para soft delete (melhora performance das consultas)
LocalSchema.index({ deletedAt: 1 });

// Índice composto para busca por cidade + soft delete
LocalSchema.index({ cidade: 1, deletedAt: 1 });

// Atualizar atualizadoEm antes de salvar
LocalSchema.pre('save', async function() {
  this.atualizadoEm = new Date();
});

