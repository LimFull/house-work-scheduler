import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';

@Module({
  imports: [HttpModule],
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}
