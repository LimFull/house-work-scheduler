import { MongoClient } from 'mongodb';
import { createConnection } from 'typeorm';
import { HouseWorkHistory } from '../scheduler/entities/housework-history.entity';

interface MongoHouseWorkHistory {
  _id: string;
  id: string;
  title: string;
  assignee: string;
  memo?: string;
  date: string;
  dayOfWeek: string;
  originalHouseWorkId: string;
  url?: string;
  isDone: boolean;
  scheduledDate: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

async function migrateData() {
  console.log('MongoDB에서 MySQL로 데이터 마이그레이션을 시작합니다...');

  // MongoDB 연결
  const mongoClient = new MongoClient(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/house-work-scheduler'
  );

  // MySQL 연결
  const mysqlConnection = await createConnection({
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'house_work_scheduler',
    entities: [HouseWorkHistory],
    synchronize: false, // 마이그레이션 중에는 동기화 비활성화
  });

  try {
    await mongoClient.connect();
    console.log('MongoDB에 연결되었습니다.');

    const db = mongoClient.db();
    const collection = db.collection('houseworkhistories');

    // MongoDB에서 모든 데이터 조회
    const mongoData = await collection.find({}).toArray();
    console.log(`MongoDB에서 ${mongoData.length}개의 레코드를 찾았습니다.`);

    if (mongoData.length === 0) {
      console.log('마이그레이션할 데이터가 없습니다.');
      return;
    }

    // MySQL에 데이터 삽입
    const houseWorkRepository = mysqlConnection.getRepository(HouseWorkHistory);
    let migratedCount = 0;
    let skippedCount = 0;

    for (const mongoRecord of mongoData) {
      try {
        // 중복 확인
        const existing = await houseWorkRepository.findOne({
          where: {
            date: mongoRecord.date,
            originalHouseWorkId: mongoRecord.originalHouseWorkId,
          },
        });

        if (existing) {
          console.log(
            `중복 데이터 건너뛰기: ${mongoRecord.date} - ${mongoRecord.title}`
          );
          skippedCount++;
          continue;
        }

        // MySQL 엔티티 생성
        const mysqlEntity = new HouseWorkHistory();
        mysqlEntity.houseWorkId = mongoRecord.id;
        mysqlEntity.title = mongoRecord.title;
        mysqlEntity.assignee = mongoRecord.assignee;
        mysqlEntity.memo = mongoRecord.memo;
        mysqlEntity.date = mongoRecord.date;
        mysqlEntity.dayOfWeek = mongoRecord.dayOfWeek;
        mysqlEntity.originalHouseWorkId = mongoRecord.originalHouseWorkId;
        mysqlEntity.url = mongoRecord.url;
        mysqlEntity.isDone = mongoRecord.isDone;
        mysqlEntity.scheduledDate = mongoRecord.scheduledDate;
        mysqlEntity.completedDate = mongoRecord.completedDate;

        await houseWorkRepository.save(mysqlEntity);
        migratedCount++;
        console.log(
          `마이그레이션 완료: ${mongoRecord.date} - ${mongoRecord.title}`
        );
      } catch (error) {
        console.error(
          `마이그레이션 실패: ${mongoRecord.date} - ${mongoRecord.title}`,
          error
        );
      }
    }

    console.log(`마이그레이션 완료!`);
    console.log(`- 성공: ${migratedCount}개`);
    console.log(`- 건너뛴 중복: ${skippedCount}개`);
    console.log(`- 실패: ${mongoData.length - migratedCount - skippedCount}개`);
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  } finally {
    await mongoClient.close();
    await mysqlConnection.close();
    console.log('연결이 종료되었습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('마이그레이션이 완료되었습니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('마이그레이션 실패:', error);
      process.exit(1);
    });
}
