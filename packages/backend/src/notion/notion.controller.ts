import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { NotionService } from './notion.service';

interface ApiError {
  message?: string;
}

interface ApiResponse {
  success: boolean;
  data: unknown;
  timestamp: string;
}

@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Get('database')
  async getDatabaseData(): Promise<ApiResponse> {
    try {
      const databaseId = process.env.NOTION_DATABASE_ID;

      if (!databaseId) {
        throw new HttpException(
          'NOTION_DATABASE_ID environment variable is required',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const data: unknown =
        await this.notionService.getDatabaseData(databaseId);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Unknown error occurred';
      throw new HttpException(
        {
          message: 'Failed to fetch Notion database data',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  health() {
    return {
      message: 'Notion API is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
