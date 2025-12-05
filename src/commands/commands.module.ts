import { Module } from '@nestjs/common';
import { DownCommand } from './down.command';

@Module({
  providers: [DownCommand],
})
export class CommandsModule {}

