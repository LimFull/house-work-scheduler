import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN!;
    this.chatId = process.env.TELEGRAM_CHAT_ID!;
    this.logger.log(
      `Telegram bot service initialized with token: ${this.botToken}`
    );
  }

  async sendMessage(message: string): Promise<{
    success: boolean;
    message?: string;
    error?: unknown;
    errorMessage?: string;
  }> {
    try {
      if (!this.chatId) {
        throw new Error('TELEGRAM_CHAT_ID environment variable is not set');
      }

      if (!message) {
        throw new Error('Message cannot be empty');
      }

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const payload = {
        chat_id: this.chatId,
        text: message,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

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
