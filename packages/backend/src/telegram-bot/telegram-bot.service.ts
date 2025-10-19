import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as https from 'https';

const execAsync = promisify(exec);

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

      try {
        // curl을 사용한 방법 (우선 시도)
        const curlCommand = `curl -s -X POST "https://api.telegram.org/bot${this.botToken}/sendMessage" -H "Content-Type: application/json" -d '{"chat_id": "${this.chatId}", "text": "${message}"}'`;

        const { stdout, stderr } = await execAsync(curlCommand);

        if (stderr) {
          throw new Error(`curl error: ${stderr}`);
        }

        const response = JSON.parse(stdout);
      } catch (curlError) {
        // curl이 실패하면 Node.js 내장 https 모듈 사용
        this.logger.warn('curl failed, falling back to Node.js https module');

        const response = await this.sendWithNodeHttps(message);
        return response;
      }

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

  private async sendWithNodeHttps(message: string): Promise<{
    success: boolean;
    message?: string;
    error?: unknown;
    errorMessage?: string;
  }> {
    return new Promise(resolve => {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const payload = JSON.stringify({
        chat_id: this.chatId,
        text: message,
      });

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(url, options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            this.logger.log(
              `텔레그램 메시지 전송 성공 (Node.js https): ${message}`
            );
            resolve({
              success: true,
              message: '텔레그램 메시지가 성공적으로 전송되었습니다.',
            });
          } catch (error) {
            this.logger.error('텔레그램 응답 파싱 실패:', error);
            resolve({
              success: false,
              errorMessage: '응답 파싱 실패',
              error: error,
            });
          }
        });
      });

      req.on('error', error => {
        this.logger.error('텔레그램 메시지 전송 실패 (Node.js https):', error);
        resolve({
          success: false,
          errorMessage: error.message,
          error: error,
        });
      });

      req.write(payload);
      req.end();
    });
  }
}
