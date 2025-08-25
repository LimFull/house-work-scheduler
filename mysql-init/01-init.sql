-- MySQL 초기화 스크립트
-- house_work_scheduler 데이터베이스 생성 (이미 환경변수로 생성됨)

-- 데이터베이스 사용
USE house_work_scheduler;

-- housework_history 테이블 생성 (TypeORM이 자동으로 생성하지만 백업용)
CREATE TABLE IF NOT EXISTS housework_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  houseWorkId VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  assignee VARCHAR(100) NOT NULL,
  memo TEXT,
  date DATE NOT NULL,
  dayOfWeek VARCHAR(10) NOT NULL,
  originalHouseWorkId VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  isDone BOOLEAN DEFAULT FALSE,
  scheduledDate DATETIME NOT NULL,
  completedDate DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date_original (date, originalHouseWorkId),
  UNIQUE KEY unique_date_original (date, originalHouseWorkId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON house_work_scheduler.* TO 'housework'@'%';
FLUSH PRIVILEGES;
