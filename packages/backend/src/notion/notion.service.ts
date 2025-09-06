import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NotionDatabaseResponse, HouseWorkItem } from '../types/notion.types';
import { HouseWorkSchedulerService } from '../scheduler/housework-scheduler.service';

interface NotionApiError {
  response?: {
    data: unknown;
    status: number;
  };
  message?: string;
}

@Injectable()
export class NotionService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => HouseWorkSchedulerService))
    private readonly schedulerService: HouseWorkSchedulerService
  ) {}

  async getDatabaseData(databaseId: string): Promise<NotionDatabaseResponse> {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      const notionVersion = process.env.NOTION_VERSION || '2022-06-28';

      if (!notionToken) {
        throw new HttpException(
          'NOTION_TOKEN environment variable is required',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      if (!databaseId) {
        throw new HttpException(
          'Database ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      const response = await firstValueFrom(
        this.httpService.post<NotionDatabaseResponse>(
          `https://api.notion.com/v1/databases/${databaseId}/query`,
          {}, // 빈 body로 POST 요청
          {
            headers: {
              Authorization: `Bearer ${notionToken}`,
              'Notion-Version': notionVersion,
              'Content-Type': 'application/json',
            },
          }
        )
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
          notionError.response.status
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
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  // 집안일 데이터를 변환하는 유틸리티 메서드
  transformToHouseWorkItems(response: NotionDatabaseResponse): HouseWorkItem[] {
    return response.results.map(page => ({
      id: page.id,
      title: this.extractTitle(page),
      days: this.extractDays(page),
      assignee: this.extractAssignee(page),
      frequency: this.extractFrequency(page),
      memo: this.extractMemo(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      isDone: false, // 기본값 false
      emoji: this.extractEmoji(page),
    }));
  }

  /**
   * Notion 데이터를 가져와서 스케줄러를 업데이트합니다.
   */
  async updateSchedulerFromNotion(): Promise<void> {
    try {
      const databaseId = process.env.NOTION_DATABASE_ID;
      if (!databaseId) {
        throw new Error('NOTION_DATABASE_ID environment variable is required');
      }

      const response = await this.getDatabaseData(databaseId);
      const houseWorkItems = this.transformToHouseWorkItems(response);

      // 스케줄러에 규칙 설정
      this.schedulerService.setRules(houseWorkItems);

      // 스케줄 생성
      this.schedulerService.generateSchedule();
    } catch (error) {
      console.error('스케줄러 업데이트 실패:', error);
      throw error;
    }
  }

  private extractTitle(page: any): string {
    const titleProperty = page.properties.집안일;
    if (titleProperty?.title?.length > 0) {
      return titleProperty.title[0].plain_text;
    }
    return '';
  }

  private extractDays(page: any): string[] {
    const daysProperty = page.properties.요일;
    if (daysProperty?.multi_select) {
      return daysProperty.multi_select.map((item: any) => item.name);
    }
    return [];
  }

  private extractEmoji(page: any): string {
    const emojiProperty = page.properties.이모지;
    if (emojiProperty?.rich_text?.length > 0) {
      return emojiProperty.rich_text[0].plain_text;
    }
    return '';
  }

  private extractAssignee(page: any): string {
    const assigneeProperty = page.properties.담당;
    if (assigneeProperty?.select) {
      return assigneeProperty.select.name;
    }
    return '';
  }

  private extractFrequency(page: any): string[] {
    const frequencyProperty = page.properties.빈도;
    if (frequencyProperty?.multi_select) {
      return frequencyProperty.multi_select.map((item: any) => item.name);
    }
    return [];
  }

  private extractMemo(page: any): string {
    const memoProperty = page.properties.메모;
    if (memoProperty?.rich_text?.length > 0) {
      return memoProperty.rich_text[0].plain_text;
    }
    return '';
  }
}
