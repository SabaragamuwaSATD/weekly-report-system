import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Loads .env and makes ConfigService available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connects to MongoDB. forRootAsync waits for ConfigModule to load first.
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
