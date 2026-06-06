import { Module } from '@nestjs/common';
import { FulizaService } from './fuliza.service';
import { FulizaController } from './fuliza.controller';
import { DarajaModule } from '../daraja/daraja.module';

@Module({
  imports: [DarajaModule],
  providers: [FulizaService],
  controllers: [FulizaController],
})
export class FulizaModule {}
