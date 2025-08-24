import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface NotionApiError {
  response?: {
    data: unknown;
    status: number;
  };
  message?: string;
}

@Injectable()
export class NotionService {
  constructor(private readonly httpService: HttpService) {}

  async getDatabaseData(databaseId: string): Promise<unknown> {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      const notionVersion = process.env.NOTION_VERSION || '2022-06-28';

      if (!notionToken) {
        throw new HttpException(
          'NOTION_TOKEN environment variable is required',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!databaseId) {
        throw new HttpException(
          'Database ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.notion.com/v1/databases/${databaseId}/query`,
          {}, // 빈 body로 POST 요청
          {
            headers: {
              Authorization: `Bearer ${notionToken}`,
              'Notion-Version': notionVersion,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      const notionError = error as NotionApiError;

      if (notionError.response) {
        // Notion API에서 오는 에러 응답
        throw new HttpException(
          {
            message: 'Notion API Error',
            error: notionError.response.data,
            status: notionError.response.status,
          },
          notionError.response.status,
        );
      } else if (error instanceof HttpException) {
        // 이미 HttpException인 경우 그대로 던지기
        throw error;
      } else {
        // 기타 에러
        const errorMessage = notionError.message || 'Unknown error occurred';
        throw new HttpException(
          {
            message: 'Internal Server Error',
            error: errorMessage,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
