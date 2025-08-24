import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HouseWorkHistoryDocument = HouseWorkHistory & Document;

@Schema({ timestamps: true })
export class HouseWorkHistory {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  assignee: string;

  @Prop()
  memo: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD 형식

  @Prop({ required: true })
  dayOfWeek: string;

  @Prop({ required: true })
  originalHouseWorkId: string;

  @Prop()
  url: string;

  @Prop({ default: false })
  isDone: boolean;

  @Prop({ required: true })
  scheduledDate: Date; // 스케줄이 생성된 날짜

  @Prop()
  completedDate?: Date; // 완료된 날짜 (isDone이 true일 때)
}

export const HouseWorkHistorySchema =
  SchemaFactory.createForClass(HouseWorkHistory);

// 날짜와 originalHouseWorkId로 복합 인덱스 생성 (중복 방지)
HouseWorkHistorySchema.index(
  { date: 1, originalHouseWorkId: 1 },
  { unique: true },
);
