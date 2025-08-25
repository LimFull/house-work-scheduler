import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotionModule } from './notion/notion.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HouseWorkHistory } from './scheduler/entities/housework-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      username: process.env.MYSQL_USERNAME || 'housework',
      password: process.env.MYSQL_PASSWORD || 'housework123',
      database: process.env.MYSQL_DATABASE || 'house_work_scheduler',
      entities: [HouseWorkHistory],
      synchronize: process.env.NODE_ENV !== 'production', // 개발 환경에서만 true
      logging: process.env.NODE_ENV === 'development',
    }),
    NotionModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
