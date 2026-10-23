/**
 * main.js - 2026 부산대학교 직무연수 포털 메인 페이지 인터랙션 로직
 */

// 전역 상태 관리
let allCourses = [];
let filteredCourses = [];
let currentCategory = 'ALL';
let currentMandatoryFilter = 'ALL';
let currentModeFilter = 'ALL';
let currentTargetFilter = 'ALL';
let currentSort = 'DEFAULT';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  initEventListeners();
  renderSkeletons();
  await loadData();
});

/**
 * 데이터 로드 및 초기화
 */
async function loadData() {
  const grid = document.getElementById('courseGrid');
  try {
    allCourses = await fetchTrainingCourses();
    updateKpiStats(allCourses);
    renderCategoryTabs(allCourses);
    populateSelectFilters(allCourses);
    applyFilters();
  } catch (error) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div class="empty-title">데이터를 불러오지 못했습니다.</div>
        <div class="empty-desc">${escapeHtml(error.message)}</div>
        <button class="empty-reset-btn" onclick="location.reload()">새로고침 재시도</button>
      </div>
    `;
  }
}

/**
 * 로딩 스켈레톤 UI 렌더링
 */
function renderSkeletons() {
  const grid = document.getElementById('courseGrid');
  let skeletons = '';
  for (let i = 0; i < 6; i++) {
    skeletons += `
      <div class="skeleton-card">
        <div class="skeleton-line" style="width: 40%; height: 24px;"></div>
        <div class="skeleton-line" style="width: 80%; height: 28px; margin-top: 8px;"></div>
        <div class="skeleton-line" style="width: 100%; height: 48px;"></div>
        <div class="skeleton-line" style="width: 60%; height: 20px; margin-top: auto;"></div>
      </div>
    `;
  }
  grid.innerHTML = skeletons;
}

/**
 * KPI 통계 계산 및 화면 반영
 */
function updateKpiStats(data) {
  const total = data.length;
  const mandatory = data.filter(c => c['이수구분'] && c['이수구분'].includes('필수')).length;
  const online = data.filter(c => c['교육방식'] && c['교육방식'].includes('온라인')).length;
  const practical = data.filter(c => c['분야'] !== '법정의무교육').length;

  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('kpiMandatory').textContent = mandatory;
  document.getElementById('kpiOnline').textContent = online;
  document.getElementById('kpiPractical').textContent = practical;
}

/**
 * 분야별 카테고리 탭 동적 생성
 */
function renderCategoryTabs(data) {
  const categoryContainer = document.getElementById('categoryTabs');
  const counts = { ALL: data.length };

  data.forEach(item => {
    const cat = item['분야'] || '기타';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const categories = Object.keys(counts).filter(c => c !== 'ALL');
  
  let html = `
    <button class="category-tab active" data-category="ALL">
      전체 <span class="tab-count">${counts.ALL}</span>
    </button>
  `;

  categories.forEach(cat => {
    html += `
      <button class="category-tab" data-category="${escapeHtml(cat)}">
        ${escapeHtml(cat)} <span class="tab-count">${counts[cat]}</span>
      </button>
    `;
  });

  categoryContainer.innerHTML = html;

  // 탭 클릭 이벤트 바인딩
  categoryContainer.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      categoryContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      applyFilters();
    });
  });
}

/**
 * 필터 드롭다운 옵션 채우기
 */
function populateSelectFilters(data) {
  // 이수구분
  const statusSet = new Set();
  const modeSet = new Set();
  const targetSet = new Set();

  data.forEach(d => {
    if (d['이수구분']) statusSet.add(d['이수구분']);
    if (d['교육방식']) modeSet.add(d['교육방식']);
    if (d['대상']) targetSet.add(d['대상']);
  });

  populateSelect('filterStatus', Array.from(statusSet));
  populateSelect('filterMode', Array.from(modeSet));
  populateSelect('filterTarget', Array.from(targetSet));
}

function populateSelect(selectId, items) {
  const el = document.getElementById(selectId);
  if (!el) return;
  items.sort().forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    el.appendChild(opt);
  });
}

/**
 * 필터링 & 검색 & 정렬 적용
 */
function applyFilters() {
  const q = searchQuery.toLowerCase().trim();

  filteredCourses = allCourses.filter(item => {
    // 1. 카테고리 탭
    if (currentCategory !== 'ALL' && item['분야'] !== currentCategory) {
      return false;
    }

    // 2. 이수구분 필터
    if (currentMandatoryFilter !== 'ALL' && item['이수구분'] !== currentMandatoryFilter) {
      return false;
    }

    // 3. 교육방식 필터
    if (currentModeFilter !== 'ALL' && item['교육방식'] !== currentModeFilter) {
      return false;
    }

    // 4. 대상 필터
    if (currentTargetFilter !== 'ALL' && item['대상'] !== currentTargetFilter) {
      return false;
    }

    // 5. 검색어 (과정명, 과정코드, 담당부서, 한줄소개, 상세소개)
    if (q) {
      const targetStr = `${item['과정명']} ${item['과정코드']} ${item['담당부서']} ${item['한줄소개']} ${item['분야']} ${item['상세소개']}`.toLowerCase();
      if (!targetStr.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // 정렬 적용
  sortCourses(filteredCourses);

  // 화면 렌더링
  renderCourseGrid(filteredCourses);
  updateResultCount(filteredCourses.length);
}

/**
 * 정렬 로직
 */
function sortCourses(list) {
  if (currentSort === 'NAME_ASC') {
    list.sort((a, b) => a['과정명'].localeCompare(b['과정명'], 'ko'));
  } else if (currentSort === 'HOURS_DESC') {
    list.sort((a, b) => parseHours(b['교육시간']) - parseHours(a['교육시간']));
  } else if (currentSort === 'HOURS_ASC') {
    list.sort((a, b) => parseHours(a['교육시간']) - parseHours(b['교육시간']));
  } else {
    // DEFAULT: 시트의 원래 순서(또는 과정코드 순)
    list.sort((a, b) => (a['과정코드'] || '').localeCompare(b['과정코드'] || ''));
  }
}

function parseHours(hourStr) {
  if (!hourStr) return 0;
  const match = hourStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 과정 카드 그리드 렌더링
 */
function renderCourseGrid(courses) {
  const grid = document.getElementById('courseGrid');

  if (courses.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <div class="empty-title">일치하는 연수 과정이 없습니다.</div>
        <div class="empty-desc">선택하신 필터 조건이나 검색어에 맞는 과정이 없습니다. 조건을 다시 설정해보세요.</div>
        <button class="empty-reset-btn" onclick="resetAllFilters()">검색 및 필터 초기화</button>
      </div>
    `;
    return;
  }

  const cardsHtml = courses.map(course => {
    const code = escapeHtml(course['과정코드']);
    const title = escapeHtml(course['과정명']);
    const category = escapeHtml(course['분야']);
    const status = course['이수구분'] || '선택';
    const mode = course['교육방식'] || '집합';
    const target = escapeHtml(course['대상'] || '전 직원');
    const hours = escapeHtml(course['교육시간'] || '-');
    const period = escapeHtml(course['교육기간'] || '-');
    const dept = escapeHtml(course['담당부서'] || '-');
    const summary = escapeHtml(course['한줄소개'] || '');

    // 배지 스타일 매핑
    let statusBadgeClass = 'badge-elective';
    if (status.includes('필수')) statusBadgeClass = 'badge-mandatory';
    else if (status.includes('권장')) statusBadgeClass = 'badge-recommended';

    let modeBadgeClass = 'offline';
    if (mode.includes('온라인')) modeBadgeClass = 'online';
    else if (mode.includes('혼합')) modeBadgeClass = 'hybrid';

    return `
      <article class="course-card" onclick="location.href='detail.html?code=${encodeURIComponent(course['과정코드'])}'" style="cursor: pointer;">
        <div class="card-badges">
          <span class="badge badge-category">${category}</span>
          <span class="badge ${statusBadgeClass}">${escapeHtml(status)}</span>
          <span class="badge badge-mode ${modeBadgeClass}">${escapeHtml(mode)}</span>
          <span class="course-code-tag">${code}</span>
        </div>
        
        <h3 class="card-title">${title}</h3>
        <p class="card-desc">${summary || '상세 페이지에서 교육 목표 및 교육 내용을 확인하세요.'}</p>
        
        <div class="card-meta-list">
          <div class="meta-item">
            <span class="meta-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              수강대상
            </span>
            <span class="meta-value">${target}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              교육시간 / 부서
            </span>
            <span class="meta-value">${hours} · ${dept}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              교육기간
            </span>
            <span class="meta-value">${period}</span>
          </div>
        </div>

        <div class="card-action">
          <span class="detail-btn">
            상세 안내 보기
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </article>
    `;
  }).join('');

  grid.innerHTML = cardsHtml;
}

/**
 * 결과 건수 업데이트
 */
function updateResultCount(count) {
  const el = document.getElementById('resultsCount');
  if (el) {
    el.innerHTML = `검색 결과 <strong>${count}</strong>개 과정`;
  }
}

/**
 * 이벤트 리스너 등록
 */
function initEventListeners() {
  // 검색창 입력 이벤트 (디바운스 처리)
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    searchQuery = e.target.value;
    clearBtn.classList.toggle('active', searchQuery.length > 0);
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, 200);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.classList.remove('active');
    applyFilters();
    searchInput.focus();
  });

  // 다차원 필터 셀렉트 이벤트
  document.getElementById('filterStatus').addEventListener('change', (e) => {
    currentMandatoryFilter = e.target.value;
    applyFilters();
  });

  document.getElementById('filterMode').addEventListener('change', (e) => {
    currentModeFilter = e.target.value;
    applyFilters();
  });

  document.getElementById('filterTarget').addEventListener('change', (e) => {
    currentTargetFilter = e.target.value;
    applyFilters();
  });

  // 정렬 선택 이벤트
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFilters();
  });

  // 필터 초기화 버튼
  document.getElementById('resetBtn').addEventListener('click', resetAllFilters);
}

/**
 * 전체 필터 및 검색어 초기화
 */
function resetAllFilters() {
  searchQuery = '';
  currentCategory = 'ALL';
  currentMandatoryFilter = 'ALL';
  currentModeFilter = 'ALL';
  currentTargetFilter = 'ALL';
  currentSort = 'DEFAULT';

  document.getElementById('searchInput').value = '';
  document.getElementById('searchClearBtn').classList.remove('active');
  document.getElementById('filterStatus').value = 'ALL';
  document.getElementById('filterMode').value = 'ALL';
  document.getElementById('filterTarget').value = 'ALL';
  document.getElementById('sortSelect').value = 'DEFAULT';

  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(t => {
    t.classList.toggle('active', t.dataset.category === 'ALL');
  });

  applyFilters();
}

/**
 * XSS 방지 HTML 이스케이프 유틸리티
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
