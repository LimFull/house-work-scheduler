// Notion API 응답 타입 정의

export interface NotionUser {
  object: 'user';
  id: string;
}

export interface NotionParent {
  type: 'database_id';
  database_id: string;
}

export interface NotionText {
  type: 'text';
  text: {
    content: string;
    link: string | null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href: string | null;
}

export interface NotionRichText {
  id: string;
  type: 'rich_text';
  rich_text: NotionText[];
}

export interface NotionMultiSelectOption {
  id: string;
  name: string;
  color: string;
}

export interface NotionMultiSelect {
  id: string;
  type: 'multi_select';
  multi_select: NotionMultiSelectOption[];
}

export interface NotionSelectOption {
  id: string;
  name: string;
  color: string;
}

export interface NotionSelect {
  id: string;
  type: 'select';
  select: NotionSelectOption | null;
}

export interface NotionTitle {
  id: string;
  type: 'title';
  title: NotionText[];
}

export interface NotionProperties {
  메모: NotionRichText;
  요일: NotionMultiSelect;
  담당: NotionSelect;
  빈도: NotionMultiSelect;
  집안일: NotionTitle;
}

export interface NotionPage {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: NotionUser;
  last_edited_by: NotionUser;
  cover: string | null;
  icon: string | null;
  parent: NotionParent;
  archived: boolean;
  in_trash: boolean;
  properties: NotionProperties;
  url: string;
  public_url: string | null;
}

export interface NotionDatabaseResponse {
  object: 'list';
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
  type: 'page_or_database';
  page_or_database: Record<string, unknown>;
  request_id: string;
}

// 집안일 데이터를 추출하기 위한 유틸리티 타입
export interface HouseWorkItem {
  id: string;
  title: string;
  days: string[];
  assignee: string;
  frequency: string[];
  memo: string;
  createdTime: string;
  lastEditedTime: string;
  url: string;
  isDone: boolean;
  emoji: string;
}

// 집안일 데이터 변환 함수의 타입
export interface NotionDataTransformer {
  transformDatabaseResponse(response: NotionDatabaseResponse): HouseWorkItem[];
  extractTitle(page: NotionPage): string;
  extractDays(page: NotionPage): string[];
  extractAssignee(page: NotionPage): string;
  extractFrequency(page: NotionPage): string[];
  extractMemo(page: NotionPage): string;
}
