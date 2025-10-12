#!/usr/bin/env node

/**
 * DB의 과거 집안일 데이터에 emoji를 추가하는 마이그레이션 스크립트
 *
 * 실행 방법:
 *   node migrate-emoji.js
 *
 * 또는 실행 권한 부여 후:
 *   chmod +x migrate-emoji.js
 *   ./migrate-emoji.js
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, 'packages/backend/.env'),
});

// Notion API 설정
const NOTION_API_KEY = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  console.error('❌ 환경 변수가 설정되지 않았습니다!');
  console.error('packages/backend/.env 파일에 다음 변수를 확인하세요:');
  console.error('  - NOTION_TOKEN');
  console.error('  - NOTION_DATABASE_ID');
  process.exit(1);
}

// Notion에서 규칙 가져오기
async function fetchNotionRules() {
  console.log('📖 Notion에서 집안일 규칙을 가져오는 중...');

  const response = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Notion API 오류: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const rules = data.results.map(page => {
    const properties = page.properties;

    return {
      title: properties.Name?.title[0]?.plain_text || '',
      emoji:
        page.icon?.emoji || properties.Emoji?.rich_text[0]?.plain_text || '',
    };
  });

  console.log(`✅ ${rules.length}개의 규칙을 가져왔습니다.`);
  return rules;
}

// DB 연결 및 마이그레이션 실행
async function migrate() {
  console.log('🚀 emoji 마이그레이션 시작\n');

  let connection;

  try {
    // Notion에서 규칙 가져오기
    const rules = await fetchNotionRules();

    // title -> emoji 맵 생성
    const emojiMap = new Map();
    rules.forEach(rule => {
      if (rule.title && rule.emoji) {
        emojiMap.set(rule.title, rule.emoji);
      }
    });

    console.log('\n📋 Emoji 매핑:');
    emojiMap.forEach((emoji, title) => {
      console.log(`  ${emoji} ${title}`);
    });

    // MySQL 연결
    console.log('\n🔌 MySQL 데이터베이스에 연결 중...');
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USERNAME || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'housework_scheduler',
    });
    console.log('✅ 데이터베이스 연결 성공\n');

    // emoji가 비어있는 레코드 조회
    const [rows] = await connection.execute(
      "SELECT id, title FROM housework_history WHERE emoji IS NULL OR emoji = ''"
    );

    console.log(`📊 업데이트 대상: ${rows.length}개 레코드\n`);

    if (rows.length === 0) {
      console.log('✅ 업데이트할 레코드가 없습니다!');
      return;
    }

    // title별로 그룹핑하여 업데이트
    const titleCounts = new Map();
    const notFoundTitles = new Set();
    let updatedCount = 0;

    for (const record of rows) {
      const emoji = emojiMap.get(record.title);

      if (emoji) {
        await connection.execute(
          'UPDATE housework_history SET emoji = ? WHERE id = ?',
          [emoji, record.id]
        );
        updatedCount++;
        titleCounts.set(record.title, (titleCounts.get(record.title) || 0) + 1);
      } else {
        notFoundTitles.add(record.title);
      }
    }

    // 결과 출력
    console.log('✅ 업데이트 완료!\n');
    console.log(`📊 총 ${updatedCount}개 레코드 업데이트됨:\n`);
    titleCounts.forEach((count, title) => {
      const emoji = emojiMap.get(title);
      console.log(`  ${emoji} ${title}: ${count}개`);
    });

    if (notFoundTitles.size > 0) {
      console.log('\n⚠️  Notion에서 찾을 수 없는 제목:');
      notFoundTitles.forEach(title => {
        console.log(`  ❓ ${title}`);
      });
      console.log('\n  💡 이 항목들은 Notion에 없거나 일회성 집안일입니다.');
    }

    console.log('\n🎉 마이그레이션 성공!');
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 데이터베이스 연결 종료');
    }
  }
}

// 스크립트 실행
migrate();
