// DOM 요소들
const mealDateInput = document.getElementById('mealDate');
const searchBtn = document.getElementById('searchBtn');
const resultSection = document.getElementById('resultSection');
const loading = document.getElementById('loading');
const mealInfo = document.getElementById('mealInfo');
const errorMessage = document.getElementById('errorMessage');
const mealDateTitle = document.getElementById('mealDateTitle');
const mealItems = document.getElementById('mealItems');

// API 기본 설정
const API_BASE_URL = 'https://open.neis.go.kr/hub/mealServiceDietInfo';
const ATPT_OFCDC_SC_CODE = 'B10'; // 교육청 코드
const SD_SCHUL_CODE = '7081446'; // 학교 코드

// 페이지 로드 시 오늘 날짜로 설정
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    mealDateInput.value = todayString;
    
    // Enter 키 이벤트 처리
    mealDateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMealInfo();
        }
    });
    
    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener('click', searchMealInfo);
});

// 급식정보 검색 함수
async function searchMealInfo() {
    const selectedDate = mealDateInput.value;
    
    if (!selectedDate) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    // 결과 섹션 표시 및 로딩 시작
    showLoading();
    
    try {
        const mealData = await fetchMealData(selectedDate);
        displayMealInfo(selectedDate, mealData);
    } catch (error) {
        console.error('급식정보 조회 중 오류 발생:', error);
        showError();
    }
}

// API에서 급식정보 가져오기
async function fetchMealData(date) {
    const url = `${API_BASE_URL}?ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${date.replace(/-/g, '')}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return parseMealData(data);
    } catch (error) {
        throw new Error('급식정보를 가져오는데 실패했습니다.');
    }
}

// API 응답 데이터 파싱
function parseMealData(data) {
    // API 응답 구조 확인
    if (data.RESULT && data.RESULT.CODE === 'INFO-200') {
        // 급식정보가 없는 경우
        return null;
    }
    
    if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]) {
        const mealInfo = data.mealServiceDietInfo[1].row[0];
        return mealInfo.DDISH_NM; // 급식 메뉴
    }
    
    return null;
}

// 급식정보 표시
function displayMealInfo(date, mealData) {
    hideLoading();
    
    if (!mealData) {
        showError();
        return;
    }
    
    // 날짜 포맷팅
    const formattedDate = formatDate(date);
    mealDateTitle.textContent = `${formattedDate} 급식정보`;
    
    // 급식 메뉴 파싱 및 표시
    const menuItems = parseMenuItems(mealData);
    displayMenuItems(menuItems);
    
    // 결과 섹션 표시
    resultSection.style.display = 'block';
    mealInfo.style.display = 'block';
    errorMessage.style.display = 'none';
}

// 메뉴 아이템 파싱
function parseMenuItems(mealData) {
    // 급식 메뉴는 보통 다음과 같은 형식으로 제공됩니다:
    // "백미밥,미역국,돈까스,양배추샐러드,김치,요구르트"
    
    // 알레르기 정보 제거 (괄호 안의 내용)
    const cleanMenu = mealData.replace(/\([^)]*\)/g, '').trim();
    
    // 쉼표로 분리하여 메뉴 아이템 추출
    const items = cleanMenu.split(',').map(item => item.trim()).filter(item => item);
    
    return items;
}

// 메뉴 아이템 표시
function displayMenuItems(menuItems) {
    mealItems.innerHTML = '';
    
    if (menuItems.length === 0) {
        mealItems.innerHTML = '<p>급식 메뉴 정보가 없습니다.</p>';
        return;
    }
    
    const ul = document.createElement('ul');
    
    menuItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
    });
    
    mealItems.appendChild(ul);
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

// 로딩 표시
function showLoading() {
    resultSection.style.display = 'block';
    loading.style.display = 'flex';
    mealInfo.style.display = 'none';
    errorMessage.style.display = 'none';
}

// 로딩 숨기기
function hideLoading() {
    loading.style.display = 'none';
}

// 에러 메시지 표시
function showError() {
    hideLoading();
    resultSection.style.display = 'block';
    mealInfo.style.display = 'none';
    errorMessage.style.display = 'block';
}

// 날짜 유효성 검사
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// CORS 우회를 위한 프록시 서버 사용 (필요한 경우)
// 실제 운영 환경에서는 서버 사이드에서 API 호출을 처리하는 것이 좋습니다
async function fetchWithProxy(url) {
    // CORS 문제가 발생할 경우를 대비한 프록시 서버 사용
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    
    try {
        const response = await fetch(proxyUrl);
        return response;
    } catch (error) {
        // 프록시 서버 실패 시 직접 요청 시도
        return await fetch(url);
    }
}

// 추가 기능: 최근 급식정보 캐싱
const mealCache = new Map();

// 캐시된 급식정보 가져오기
function getCachedMealData(date) {
    return mealCache.get(date);
}

// 급식정보 캐시에 저장
function cacheMealData(date, data) {
    mealCache.set(date, {
        data: data,
        timestamp: Date.now()
    });
    
    // 캐시 크기 제한 (최대 30개)
    if (mealCache.size > 30) {
        const firstKey = mealCache.keys().next().value;
        mealCache.delete(firstKey);
    }
}

// 캐시 만료 시간 확인 (24시간)
function isCacheExpired(timestamp) {
    const now = Date.now();
    const cacheAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    return cacheAge > maxAge;
}
