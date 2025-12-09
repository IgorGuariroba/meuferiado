import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TermoBuscaDocument = TermoBusca & Document;

@Schema({ timestamps: true })
export class TermoBusca {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  termo: string;

  @Prop({ required: false, default: true })
  ativo?: boolean;

  @Prop({ required: false })
  descricao?: string;
}

export const TermoBuscaSchema = SchemaFactory.createForClass(TermoBusca);

