/**
 * detail.js - 2026 부산대학교 직무연수 포털 상세 페이지 로직
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const courseCode = urlParams.get('code');

  if (!courseCode) {
    renderError('연수 과정 코드가 지정되지 않았습니다.', '목록에서 안내받고자 하는 과정을 선택해 주세요.');
    return;
  }

  await loadCourseDetail(courseCode);
});

/**
 * 과정 상세 데이터 로드 및 렌더링
 */
async function loadCourseDetail(targetCode) {
  const container = document.getElementById('detailApp');
  try {
    const courses = await fetchTrainingCourses();
    const course = courses.find(c => (c['과정코드'] || '').trim().toUpperCase() === targetCode.trim().toUpperCase());

    if (!course) {
      renderError(
        `요청하신 과정코드 "${escapeHtml(targetCode)}"을(를) 찾을 수 없습니다.`,
        '코드 번호를 다시 확인하시거나 전체 교육과정 목록에서 검색해 주세요.'
      );
      return;
    }

    // 문서 타이틀 갱신
    document.title = `${course['과정명']} | 2026 부산대학교 직무연수`;

    // 추천 연관 과정 탐색 (동일 분야 다른 과정 최대 3개)
    const relatedCourses = courses.filter(c => 
      c['과정코드'] !== course['과정코드'] && c['분야'] === course['분야']
    ).slice(0, 3);

    renderDetailPage(course, relatedCourses);

  } catch (error) {
    renderError('데이터를 실시간으로 불러오지 못했습니다.', error.message);
  }
}

/**
 * 상세 페이지 전체 뷰 렌더링
 */
function renderDetailPage(course, relatedList) {
  const container = document.getElementById('detailApp');

  const code = escapeHtml(course['과정코드']);
  const title = escapeHtml(course['과정명']);
  const category = escapeHtml(course['분야']);
  const status = course['이수구분'] || '선택';
  const mode = course['교육방식'] || '집합';
  const target = escapeHtml(course['대상'] || '전 직원');
  const hours = escapeHtml(course['교육시간'] || '-');
  const capacity = escapeHtml(course['정원'] || '정원 문의');
  const period = escapeHtml(course['교육기간'] || '연중');
  const applyPeriod = escapeHtml(course['신청기간'] || '상시');
  const dept = escapeHtml(course['담당부서'] || '인재개발원');
  const summary = escapeHtml(course['한줄소개'] || '');
  const detailDesc = escapeHtml(course['상세소개'] || '');
  const goalsRaw = course['학습목표'] || '';
  const curriculumRaw = course['주요내용'] || '';
  const applyUrl = course['신청링크'] || '#';
  const contact = escapeHtml(course['문의'] || '');

  // 배지 스타일 매핑
  let statusBadgeClass = 'badge-elective';
  if (status.includes('필수')) statusBadgeClass = 'badge-mandatory';
  else if (status.includes('권장')) statusBadgeClass = 'badge-recommended';

  let modeBadgeClass = 'offline';
  if (mode.includes('온라인')) modeBadgeClass = 'online';
  else if (mode.includes('혼합')) modeBadgeClass = 'hybrid';

  // 학습목표 파싱 (가운데점 · 기준 분리)
  const goals = goalsRaw.split('·').map(g => g.trim()).filter(Boolean);
  
  // 주요내용 파싱 (가운데점 · 기준 분리)
  const curriculumItems = curriculumRaw.split('·').map(c => c.trim()).filter(Boolean);

  // 전화번호 추출
  const phoneMatch = contact.match(/(\d{2,4}-\d{3,4}-\d{4})/);
  const phoneNumber = phoneMatch ? phoneMatch[0] : '';

  container.innerHTML = `
    <!-- 브레드크럼 -->
    <nav class="breadcrumb-nav" aria-label="경로 내비게이션">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item"><a href="index.html">홈</a></li>
        <li class="breadcrumb-separator">/</li>
        <li class="breadcrumb-item"><a href="index.html">${category}</a></li>
        <li class="breadcrumb-separator">/</li>
        <li class="breadcrumb-item breadcrumb-current" aria-current="page">${code}</li>
      </ol>
    </nav>

    <!-- 상세 히어로 헤더 -->
    <header class="detail-hero">
      <div class="detail-hero-container">
        <a href="index.html" class="back-link">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          전체 연수 목록으로 돌아가기
        </a>

        <div class="detail-header-badges">
          <span class="detail-code-badge">${code}</span>
          <span class="badge badge-category">${category}</span>
          <span class="badge ${statusBadgeClass}">${escapeHtml(status)}</span>
          <span class="badge badge-mode ${modeBadgeClass}">${escapeHtml(mode)}</span>
        </div>

        <h1 class="detail-title">${title}</h1>
        <p class="detail-summary">${summary}</p>

        <!-- CTA 액션 버튼 그룹 -->
        <div class="detail-cta-bar">
          <a href="${escapeHtml(applyUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary-cta">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            수강신청 바로가기 (외부 HRD)
          </a>

          <button type="button" class="btn-secondary-action" onclick="copyCurrentUrl()">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            과정 링크 복사
          </button>
        </div>
      </div>
    </header>

    <!-- 상세 메인 본문 -->
    <main class="detail-main-wrap">
      
      <!-- 핵심 스펙 6분면 그리드 -->
      <section class="spec-grid" aria-label="과정 핵심 스펙 요약">
        <div class="spec-card">
          <div class="spec-icon-wrap">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <div class="spec-info-label">수강대상</div>
            <div class="spec-info-value">${target}</div>
          </div>
        </div>

        <div class="spec-card">
          <div class="spec-icon-wrap">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <div class="spec-info-label">교육시간 / 정원</div>
            <div class="spec-info-value">${hours} · ${capacity}</div>
          </div>
        </div>

        <div class="spec-card">
          <div class="spec-icon-wrap">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <div class="spec-info-label">이수구분 / 교육방식</div>
            <div class="spec-info-value">${escapeHtml(status)} (${escapeHtml(mode)})</div>
          </div>
        </div>

        <div class="spec-card">
          <div class="spec-icon-wrap">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <div class="spec-info-label">신청기간</div>
            <div class="spec-info-value">${applyPeriod}</div>
          </div>
        </div>

        <div class="spec-card">
          <div class="spec-icon-wrap">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div>
            <div class="spec-info-label">교육기간</div>
            <div class="spec-info-value">${period}</div>
          </div>
        </div>

        <div class="spec-card">
          <div class="spec-icon-wrap">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </div>
          <div>
            <div class="spec-info-label">담당부서 및 문의</div>
            <div class="spec-info-value">${dept} (${contact || '부서 문의'})</div>
          </div>
        </div>
      </section>

      <!-- 1. 과정 상세 소개 섹션 -->
      <section class="detail-section">
        <div class="section-head">
          <svg class="section-head-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h2 class="section-title">과정 상세 소개</h2>
        </div>
        <div class="detail-text-content">
          ${detailDesc || '본 과정에 대한 상세 소개 내용이 준비 중입니다.'}
        </div>
      </section>

      <!-- 2. 핵심 학습 목표 섹션 -->
      <section class="detail-section">
        <div class="section-head">
          <svg class="section-head-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h2 class="section-title">핵심 학습 목표</h2>
        </div>
        <div class="goals-list">
          ${goals.length > 0 ? goals.map(g => `
            <div class="goal-item">
              <svg class="goal-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              <div class="goal-text">${escapeHtml(g)}</div>
            </div>
          `).join('') : '<p class="detail-text-content">학습 목표 내용이 등록되어 있지 않습니다.</p>'}
        </div>
      </section>

      <!-- 3. 주요 교육 내용 및 커리큘럼 섹션 -->
      <section class="detail-section">
        <div class="section-head">
          <svg class="section-head-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <h2 class="section-title">주요 교육 내용 (커리큘럼)</h2>
        </div>
        <div class="curriculum-grid">
          ${curriculumItems.length > 0 ? curriculumItems.map((item, idx) => `
            <div class="curriculum-card">
              <span class="curriculum-num">MODULE 0${idx + 1}</span>
              <h4 class="curriculum-title">${escapeHtml(item)}</h4>
            </div>
          `).join('') : '<p class="detail-text-content">커리큘럼 상세 정보가 없습니다.</p>'}
        </div>
      </section>

      <!-- 4. 문의처 다이렉트 배너 -->
      <section class="inquiry-banner">
        <div class="inquiry-left">
          <div class="inquiry-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <div class="inquiry-title">교육 신청 및 수료 관련 문의</div>
            <div class="inquiry-desc">${dept} · 직무연수 운영 담당자</div>
          </div>
        </div>
        <div>
          ${phoneNumber ? `
            <a href="tel:${phoneNumber.replace(/-/g, '')}" class="phone-link">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              ${contact} 전화 문의
            </a>
          ` : `<span class="phone-link">${contact || '교내 인재개발원 문의'}</span>`}
        </div>
      </section>

      <!-- 5. 관련 추천 과정 섹션 -->
      ${relatedList.length > 0 ? `
        <section class="related-courses-section">
          <h3 class="related-title">${category} 분야의 다른 추천 과정</h3>
          <div class="course-grid">
            ${relatedList.map(r => `
              <article class="course-card" onclick="location.href='detail.html?code=${encodeURIComponent(r['과정코드'])}'" style="cursor: pointer;">
                <div class="card-badges">
                  <span class="badge badge-category">${escapeHtml(r['분야'])}</span>
                  <span class="badge ${r['이수구분'].includes('필수') ? 'badge-mandatory' : (r['이수구분'].includes('권장') ? 'badge-recommended' : 'badge-elective')}">
                    ${escapeHtml(r['이수구분'])}
                  </span>
                  <span class="course-code-tag">${escapeHtml(r['과정코드'])}</span>
                </div>
                <h4 class="card-title">${escapeHtml(r['과정명'])}</h4>
                <p class="card-desc">${escapeHtml(r['한줄소개'] || '')}</p>
                <div class="card-action">
                  <span class="detail-btn">과정 보러가기 &rarr;</span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      ` : ''}

    </main>
  `;
}

/**
 * 에러 상태 화면 렌더링
 */
function renderError(title, desc) {
  const container = document.getElementById('detailApp');
  container.innerHTML = `
    <div style="max-width: var(--max-width); margin: 60px auto; padding: 0 24px;">
      <div class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div class="empty-title">${escapeHtml(title)}</div>
        <div class="empty-desc">${escapeHtml(desc)}</div>
        <a href="index.html" class="empty-reset-btn" style="display: inline-block;">전체 연수 목록으로 이동</a>
      </div>
    </div>
  `;
}

/**
 * 과정 링크 복사 토스트
 */
function copyCurrentUrl() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('과정 상세 주소가 클립보드에 복사되었습니다.');
  }).catch(() => {
    showToast('URL 복사 실패: 주소창의 주소를 복사해 주세요.');
  });
}

function showToast(msg) {
  let toast = document.getElementById('toastMsg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastMsg';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/**
 * XSS 방지 유틸리티
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
