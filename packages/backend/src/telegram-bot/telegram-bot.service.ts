import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramBotService {
  private readonly bot: TelegramBot = new TelegramBot(
    `${process.env.TELEGRAM_BOT_TOKEN}`
  );

  constructor() {}

  async sendMessage(message: string) {
    await this.bot.sendMessage(`${process.env.TELEGRAM_CHAT_ID}`, message);
  }
}
