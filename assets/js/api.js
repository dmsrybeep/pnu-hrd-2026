/**
 * api.js - 2026 부산대학교 직무연수 데이터 실시간 Google Sheets 연동 모듈
 */

const SHEET_ID = '1sWeq6LCPTp0I6ith07XQizLm-KcDvAcbeNZBHkOBOvk';
const SHEET_NAME = 'data';

// Google Sheets gviz CSV 엔드포인트 (&headers=1 파라미터는 1행 누락 방지 필수 파라미터)
function getCsvUrl() {
  const timestamp = Date.now();
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}&headers=1&_t=${timestamp}`;
}

/**
 * 구글 스프레드시트에서 실시간 데이터를 CSV로 가져와 파싱 후 반환
 * @returns {Promise<Array<Object>>} 정제된 연수 과정 목록
 */
async function fetchTrainingCourses() {
  const url = getCsvUrl();
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`데이터를 불러오지 못했습니다. (HTTP 상태: ${response.status})`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('구글 시트에서 데이터를 찾을 수 없습니다.'));
            return;
          }

          // 유효한 과정코드 및 과정명이 있는 행만 필터링하고 공백 정리
          const cleanedData = results.data
            .map(row => {
              const cleanRow = {};
              for (const [key, value] of Object.entries(row)) {
                cleanRow[key.trim()] = (value || '').trim();
              }
              return cleanRow;
            })
            .filter(item => item['과정코드'] && item['과정명']);

          resolve(cleanedData);
        },
        error: (err) => {
          reject(new Error('CSV 파싱 오류: ' + err.message));
        }
      });
    });
  } catch (error) {
    console.error('구글 시트 연동 실패:', error);
    throw error;
  }
}
