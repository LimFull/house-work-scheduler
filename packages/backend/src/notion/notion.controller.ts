import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionDatabaseResponse, HouseWorkItem } from '../types/notion.types';

interface ApiError {
  message?: string;
}

interface ApiResponse {
  success: boolean;
  data: NotionDatabaseResponse;
  timestamp: string;
}

interface HouseWorkApiResponse {
  success: boolean;
  data: HouseWorkItem[];
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

      const data: NotionDatabaseResponse =
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

  @Get('housework')
  async getHouseWorkItems(): Promise<HouseWorkApiResponse> {
    try {
      const databaseId = process.env.NOTION_DATABASE_ID;

      if (!databaseId) {
        throw new HttpException(
          'NOTION_DATABASE_ID environment variable is required',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const rawData = await this.notionService.getDatabaseData(databaseId);
      const houseWorkItems =
        this.notionService.transformToHouseWorkItems(rawData);

      return {
        success: true,
        data: houseWorkItems,
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
          message: 'Failed to fetch house work items',
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
