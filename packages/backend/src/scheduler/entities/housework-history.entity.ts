import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('housework_history')
@Index(['date', 'originalHouseWorkId'], { unique: true })
export class HouseWorkHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  houseWorkId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  assignee: string;

  @Column({ type: 'text', nullable: true })
  memo: string;

  @Column({ type: 'date', nullable: false })
  date: string; // YYYY-MM-DD 형식

  @Column({ type: 'varchar', length: 10, nullable: false })
  dayOfWeek: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  originalHouseWorkId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'boolean', default: false })
  isDone: boolean;

  @Column({ type: 'datetime', nullable: false })
  scheduledDate: Date; // 스케줄이 생성된 날짜

  @Column({ type: 'datetime', nullable: true })
  completedDate?: Date; // 완료된 날짜 (isDone이 true일 때)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
