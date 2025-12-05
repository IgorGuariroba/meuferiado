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

  @Prop({ required: true, min: 0 })
  preco: number;

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

  @Prop({ type: Types.ObjectId, ref: 'Cidade', required: false })
  cidade?: Types.ObjectId;

  @Prop({ default: Date.now })
  criadoEm: Date;

  @Prop({ default: Date.now })
  atualizadoEm: Date;
}

export const LocalSchema = SchemaFactory.createForClass(Local);

// Índice geográfico 2dsphere para queries de proximidade
LocalSchema.index({ localizacao: '2dsphere' });

// Índices para busca rápida
LocalSchema.index({ tipo: 1 });
LocalSchema.index({ preco: 1 });
LocalSchema.index({ cidade: 1 });

// Índice composto para busca por tipo + localização
LocalSchema.index({ tipo: 1, localizacao: '2dsphere' });

// Atualizar atualizadoEm antes de salvar
LocalSchema.pre('save', async function() {
  this.atualizadoEm = new Date();
});

