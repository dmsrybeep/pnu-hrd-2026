# 2026 부산대학교 직무연수 포털 (PNU HRD Portal)

2026학년도 부산대학교 교직원을 위한 직무역량 강화 연수(법정의무교육, 직무공통, 예산·회계, 정보화·AI, 대학행정 특화 등) 안내 및 수강신청을 제공하는 2페이지 반응형 웹사이트입니다.

## 🌟 주요 기능 및 특징
- **실시간 Google Sheets 연동 (No Hardcoding):** 
  - Google Visualization API (`gviz/tq?tqx=out:csv&sheet=data&headers=1`)와 PapaParse를 사용하여 구글 스프레드시트의 32개 교육과정 데이터를 실시간으로 파싱합니다.
  - 구글 시트에서 데이터를 수정하면 새로고침(`F5`) 시 즉시 변경 사항이 사이트에 반영됩니다.
- **frontend-design 가이드라인 준수:**
  - PNU 브랜드 아이덴티티(PNU Blue `#004b8d`, Deep Navy `#002f5a`, Accent Cyan/Amber)를 적용한 기품 있고 신뢰감 넘치는 포털 디자인
  - Pretendard 한글 웹폰트 및 시각적 계층 구조 적용
  - 다차원 필터(10개 분야 탭, 이수구분, 교육방식, 대상) 및 실시간 검색(디바운스 적용)
  - 스켈레톤 로딩 애니메이션 및 모바일/태블릿 완전 반응형 지원
- **2페이지 구성:**
  - `index.html`: KPI 요약 지표, 검색 & 카테고리 탭 & 다차원 필터, 과정 카드 그리드
  - `detail.html`: URL 쿼리 파라미터(`?code=...`) 기반 상세 스펙 6분면 그리드, 학습 목표 체크리스트, 커리큘럼 모듈, 수강신청 외부 HRD 링크, 담당부서 전화 문의, 연관 과정 추천

## 📁 디렉토리 구조
```text
.
├── index.html               # 메인 페이지 (개요, KPI 지표, 검색, 카테고리 탭, 필터, 카드 그리드)
├── detail.html              # 상세 페이지 (과정별 스펙, 학습목표, 커리큘럼, 신청/문의)
├── assets/
│   ├── css/
│   │   └── style.css        # PNU 디자인 토큰, frontend-design 표준 스타일, 반응형 미디어쿼리
│   └── js/
│       ├── api.js           # 구글 시트 gviz CSV fetcher (PapaParse 파싱 및 캐시 방지)
│       ├── main.js          # index.html 전용 (검색, 필터, 정렬, 카드 렌더링)
│       └── detail.js        # detail.html 전용 (파라미터 파싱, 상세정보 렌더링, 추천과정)
├── PLAN.md                  # 작업 기획서
└── README.md                # 저장소 소개 문서
```

## 🚀 GitHub Pages 배포 설정
본 저장소는 GitHub Pages를 통해 배포됩니다:
1. 저장소의 **Settings** > **Pages** 이동
2. **Build and deployment** > **Source**에서 **Deploy from a branch** 선택
3. **Branch**를 `main` / `root`로 선택 후 **Save**
4. 약 1분 후 제공되는 GitHub Pages URL로 웹사이트에 접속할 수 있습니다.
