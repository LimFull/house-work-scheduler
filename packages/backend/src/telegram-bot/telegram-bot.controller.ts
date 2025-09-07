import { Controller, Post, Body, Get } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';

@Controller('telegram-bot')
export class TelegramBotController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Post('send-message')
  async sendMessage(@Body() body: { message: string }) {
    return this.telegramBotService.sendMessage(body.message);
  }

  @Get('test')
  async test() {
    return this.telegramBotService.sendMessage('테스트 메시지');
  }
}
