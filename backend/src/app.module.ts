import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DarajaModule } from './daraja/daraja.module';
import { AuthModule } from './auth/auth.module';
import { FulizaModule } from './fuliza/fuliza.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DarajaModule,
    AuthModule,
    FulizaModule,
  ],
})
export class AppModule {}
