import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CidadeDocument = Cidade & Document;

@Schema({ timestamps: false })
export class Cidade {
  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ required: false, trim: true })
  estado?: string;

  @Prop({ required: false, trim: true })
  pais?: string;

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

  @Prop({ default: Date.now })
  criadoEm: Date;

  @Prop({ default: Date.now })
  atualizadoEm: Date;
}

export const CidadeSchema = SchemaFactory.createForClass(Cidade);

// Índice geográfico 2dsphere
CidadeSchema.index({ localizacao: '2dsphere' });

// Índice único composto
CidadeSchema.index({ nome: 1, estado: 1, pais: 1 }, { unique: true });

// Índice para busca rápida por nome
CidadeSchema.index({ nome: 1 });

// Atualizar atualizadoEm antes de salvar
CidadeSchema.pre('save', async function() {
  this.atualizadoEm = new Date();
});

