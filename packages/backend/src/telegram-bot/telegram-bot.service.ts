import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(`${process.env.TELEGRAM_BOT_TOKEN}`);
    this.logger.log(
      `Telegram bot initialized, token: ${process.env.TELEGRAM_BOT_TOKEN}`
    );
  }

  async sendMessage(message: string): Promise<{
    success: boolean;
    message?: string;
    error?: unknown;
    errorMessage?: string;
  }> {
    try {
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!chatId) {
        throw new Error('TELEGRAM_CHAT_ID environment variable is not set');
      }

      if (!message) {
        throw new Error('Message cannot be empty');
      }

      const result = await this.bot.sendMessage(chatId, message);
      this.logger.log(`텔레그램 메시지 전송 성공: ${message}`);

      return {
        success: true,
        message: '텔레그램 메시지가 성공적으로 전송되었습니다.',
      };
    } catch (error) {
      this.logger.error('텔레그램 메시지 전송 실패:', error);
      return {
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        error: error,
      };
    }
  }
}
