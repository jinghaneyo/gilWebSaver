// 전역 오류 핸들러 - 타사 스크립트 및 프레임워크 오류 무시
window.addEventListener('error', function(event) {
  const errorSources = [
    'drift.com', 'intercom.io', 'zendesk.com', 'tawk.to', 
    'crisp.chat', 'google-analytics.com', 'googletagmanager.com',
    'facebook.com', 'twitter.com', 'linkedin.com', 'techtarget.com',
    'ibc-flow', 'snippet.js', 'deployment.js', 'c3ugtv46u366.js',
    'presence.api.drift.com', 'api.drift.com'
  ];
  
  const frameworkErrors = [
    'webpack', 'next.js', 'react', 'vue', 'angular',
    'chunk.js', 'runtime.js', 'vendor.js', 'main-app',
    'SC_ERROR', 'scTraceId', 'pageViewId', 'ZalgoPromise',
    'DRIFT_WIDGET', 'site concierge', 'fs.js', 'WebSocket connection',
    'wss://', 'ws://', 'websocket', 'session_token'
  ];
  
  const filename = event.filename || '';
  const message = event.message || '';
  
  if (errorSources.some(source => filename.includes(source))) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  
  if (frameworkErrors.some(pattern => 
    filename.includes(pattern) || message.includes(pattern))) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
}, true);

// Promise rejection 오류 무시
window.addEventListener('unhandledrejection', function(event) {
  const errorMessage = event.reason?.message || event.reason || '';
  const errorStack = event.reason?.stack || '';
  
  const networkErrors = [
    'WebSocket', 'ws://', 'wss://', 'chat.api.drift.com', 'presence.api.drift.com',
    'Failed to fetch', 'NetworkError', 'net::ERR_',
    'ibc-flow', 'techtarget.com', 'websocket', 'session_token'
  ];
  
  const frameworkErrors = [
    'webpack', 'next.js', 'react', 'vue', 'angular',
    'chunk.js', 'SC_ERROR', 'scTraceId', 'hydration',
    'ChunkLoadError', 'Loading chunk', 'pageViewId',
    'DRIFT_WIDGET', 'ZalgoPromise', 'connect @'
  ];
  
  if (networkErrors.some(pattern => 
    errorMessage.includes(pattern) || errorStack.includes(pattern))) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  
  if (frameworkErrors.some(pattern => 
    errorMessage.includes(pattern) || errorStack.includes(pattern))) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
});

// 추가 오류 차단 - Console 오류도 차단
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  const blockedPatterns = [
    'WebSocket connection', 'wss://', 'ws://', 'drift.com',
    'presence.api.drift.com', 'session_token', 'websocket',
    'DRIFT_WIDGET', 'connect @', 'chunk.js'
  ];
  
  if (blockedPatterns.some(pattern => message.includes(pattern))) {
    // 차단된 오류는 출력하지 않음
    return;
  }
  
  // 차단되지 않은 오류만 출력
  originalConsoleError.apply(console, args);
};

// ===== DIV 선택 기능 관련 변수와 함수 =====
let selectMode = false;
let selectedElements = new Set();
let hoverElement = null;

// 선택 모드 스타일 추가
function addSelectionStyles() {
  if (document.getElementById('web-content-saver-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'web-content-saver-styles';
  style.textContent = `
    .wcs-selectable {
      cursor: pointer !important;
    }
    .wcs-hover {
      outline: 2px dashed #2196F3 !important;
      outline-offset: 2px !important;
      background-color: rgba(33, 150, 243, 0.1) !important;
    }
    .wcs-selected {
      outline: 3px solid #4CAF50 !important;
      outline-offset: 2px !important;
      background-color: rgba(76, 175, 80, 0.15) !important;
    }
    .wcs-tooltip {
      position: fixed !important;
      background: rgba(0, 0, 0, 0.8) !important;
      color: white !important;
      padding: 5px 10px !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      z-index: 10001 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

// 선택 모드 스타일 제거
function removeSelectionStyles() {
  const style = document.getElementById('web-content-saver-styles');
  if (style) style.remove();
  
  // 모든 선택된 요소의 클래스 제거
  document.querySelectorAll('.wcs-hover, .wcs-selected, .wcs-selectable').forEach(el => {
    el.classList.remove('wcs-hover', 'wcs-selected', 'wcs-selectable');
    removeSelectionBadge(el);
  });
  
  // 남은 배지들 모두 제거
  document.querySelectorAll('.wcs-selection-badge').forEach(badge => badge.remove());
}

// 툴팁 표시
function showTooltip(element, x, y) {
  removeTooltip();
  
  const tooltip = document.createElement('div');
  tooltip.className = 'wcs-tooltip';
  
  // 안전한 클래스명 처리
  let classText = '';
  try {
    if (element.className && typeof element.className === 'string' && element.className.trim()) {
      const classes = element.className.split(' ')
        .filter(cls => cls && !cls.startsWith('wcs-')) // wcs- 클래스 제외
        .join('.');
      if (classes) {
        classText = '.' + classes;
      }
    }
  } catch (e) {
    // className 처리 실패시 무시
  }
  
  tooltip.textContent = `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${classText}`;
  tooltip.style.left = x + 10 + 'px';
  tooltip.style.top = y - 30 + 'px';
  document.body.appendChild(tooltip);
}

// 툴팁 제거
function removeTooltip() {
  const tooltip = document.querySelector('.wcs-tooltip');
  if (tooltip) tooltip.remove();
}

// 선택 배지 추가
function addSelectionBadge(element) {
  // 기존 배지가 있으면 제거
  removeSelectionBadge(element);
  
  const badge = document.createElement('div');
  badge.className = 'wcs-selection-badge';
  badge.textContent = '✓';
  badge.style.cssText = `
    position: fixed !important;
    background: #4CAF50 !important;
    color: white !important;
    padding: 2px 6px !important;
    font-size: 10px !important;
    font-weight: bold !important;
    border-radius: 2px !important;
    z-index: 10000 !important;
    pointer-events: none !important;
  `;
  
  // 요소의 위치 계산
  const rect = element.getBoundingClientRect();
  badge.style.left = (rect.right - 20) + 'px';
  badge.style.top = (rect.top + window.scrollY) + 'px';
  
  document.body.appendChild(badge);
  
  // 요소에 배지 참조 저장
  element._wcsBadge = badge;
}

// 선택 배지 제거
function removeSelectionBadge(element) {
  if (element._wcsBadge) {
    element._wcsBadge.remove();
    delete element._wcsBadge;
  }
}

// 마우스 이동 핸들러
function handleMouseMove(e) {
  if (!selectMode) return;
  
  const element = e.target;
  
  // 이전 hover 제거
  if (hoverElement && hoverElement !== element) {
    hoverElement.classList.remove('wcs-hover');
  }
  
  // 새 hover 추가
  if (element !== document.body && element !== document.documentElement) {
    element.classList.add('wcs-hover');
    hoverElement = element;
    showTooltip(element, e.clientX, e.clientY);
  }
}

// 클릭 핸들러
function handleClick(e) {
  if (!selectMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  
  if (element === document.body || element === document.documentElement) return;
  
  // 선택/해제 토글
  if (selectedElements.has(element)) {
    selectedElements.delete(element);
    element.classList.remove('wcs-selected');
    removeSelectionBadge(element);
  } else {
    selectedElements.add(element);
    element.classList.add('wcs-selected');
    addSelectionBadge(element);
  }
  
  console.log(`✅ Web Content Saver: ${selectedElements.size}개 요소 선택됨`);
}

// 선택 모드 활성화
function enableSelectMode() {
  selectMode = true;
  
  // 이전에 선택된 요소들 초기화
  selectedElements.clear();
  document.querySelectorAll('.wcs-selected').forEach(el => {
    el.classList.remove('wcs-selected');
    removeSelectionBadge(el);
  });
  
  addSelectionStyles();
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick, true);
  
  // 모든 div, section, article 등에 selectable 클래스 추가
  document.querySelectorAll('div, section, article, main, aside, header, footer, nav').forEach(el => {
    el.classList.add('wcs-selectable');
  });
  
  console.log('✅ Web Content Saver: 선택 모드 활성화 - 이전 선택 초기화됨');
}

// 선택 모드 비활성화
function disableSelectMode() {
  selectMode = false;
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick, true);
  
  removeTooltip();
  removeSelectionStyles();
  
  console.log('✅ Web Content Saver: 선택 모드 비활성화');
}

// 선택 초기화
function clearSelection() {
  selectedElements.forEach(el => {
    removeSelectionBadge(el);
  });
  selectedElements.clear();
  document.querySelectorAll('.wcs-selected').forEach(el => {
    el.classList.remove('wcs-selected');
  });
  console.log('✅ Web Content Saver: 선택 초기화');
}

// ===== 메시지 리스너 =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Web Content Saver: 메시지 수신 -', request.action);
  
  try {
    switch(request.action) {
      case 'ping':
        // Content script 로드 확인용
        sendResponse({ success: true, message: 'Content script loaded' });
        break;
        
      case 'getSelectMode':
        // 현재 선택 모드 상태 반환
        sendResponse({ success: true, active: selectMode });
        break;
        
      case 'saveFullPage':
        saveFullPage().then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('Web Content Saver: 전체 페이지 저장 실패 -', error.message);
          sendResponse({ success: false, error: error.message });
        });
        return true; // 비동기 응답을 위해 true 반환
        break;
        
      case 'toggleSelectMode':
        try {
          if (request.active) {
            enableSelectMode();
            console.log('✅ Web Content Saver: 선택 모드 활성화 완료');
          } else {
            disableSelectMode();
            console.log('✅ Web Content Saver: 선택 모드 비활성화 완료');
          }
          sendResponse({ success: true });
        } catch (error) {
          console.error('Web Content Saver: 선택 모드 전환 실패 -', error.message);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'saveSelection':
        saveSelection().then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('Web Content Saver: 선택 영역 저장 실패 -', error.message);
          sendResponse({ success: false, error: error.message });
        });
        return true; // 비동기 응답을 위해 true 반환
        break;
        
      case 'clearSelection':
        try {
          clearSelection();
          sendResponse({ success: true });
        } catch (error) {
          console.error('Web Content Saver: 선택 초기화 실패 -', error.message);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      default:
        console.warn('Web Content Saver: 알 수 없는 액션 -', request.action);
        sendResponse({ success: false, error: 'Unknown action: ' + request.action });
    }
    
  } catch (error) {
    console.error('Web Content Saver: 메시지 처리 오류 -', error.message);
    sendResponse({ success: false, error: error.message });
  }
  
  // 동기 처리이므로 return true 불필요
});

// ===== 저장 함수 =====
async function saveFullPage() {
  try {
    const title = document.title || 'webpage';
    const content = await createFullHTML();
    downloadContent(content, `${sanitizeFilename(title)}_full.html`);
    console.log('✅ Web Content Saver: 전체 페이지 저장 완료');
  } catch (error) {
    console.error('Web Content Saver: 전체 페이지 저장 실패:', error);
    throw error;
  }
}

async function saveSelection() {
  try {
    console.log(`🔍 Web Content Saver: saveSelection 시작 - selectedElements.size: ${selectedElements.size}`);
    
    if (selectedElements.size === 0) {
      throw new Error('선택된 요소가 없습니다.');
    }
    
    // 선택된 요소들의 상세 정보 로깅
    console.log('🔍 선택된 요소들:');
    selectedElements.forEach((element, index) => {
      console.log(`  ${index + 1}. ${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + Array.from(element.classList).filter(cls => !cls.startsWith('wcs-')).join('.') : ''}`);
    });
    
    const title = document.title || 'webpage';
    console.log('🔍 HTML 생성 시작...');
    const content = await createSelectionHTML();
    console.log(`🔍 HTML 생성 완료 - 길이: ${content.length}자`);
    
    downloadContent(content, `${sanitizeFilename(title)}_selection.html`);
    console.log(`✅ Web Content Saver: ${selectedElements.size}개 요소 저장 완료`);
    
  } catch (error) {
    console.error('Web Content Saver: 선택 영역 저장 실패:', error);
    throw error;
  }
}

async function createFullHTML() {
  // DOCTYPE과 HTML 태그를 완전히 복사
  const html = document.documentElement.cloneNode(true);
  
  console.log('🎨 원본 페이지 구조 완벽 보존 시작...');
  
  // 선택 관련 클래스 제거 (먼저 실행)
  html.querySelectorAll('.wcs-hover, .wcs-selected, .wcs-selectable').forEach(el => {
    el.classList.remove('wcs-hover', 'wcs-selected', 'wcs-selectable');
  });
  
  // 선택 모드 스타일 제거
  const selectionStyle = html.querySelector('#web-content-saver-styles');
  if (selectionStyle) selectionStyle.remove();
  
  // WCS 관련 클래스 모두 제거
  html.querySelectorAll('[class*="wcs-"]').forEach(el => {
    const classes = Array.from(el.classList);
    classes.forEach(cls => {
      if (cls.startsWith('wcs-')) {
        el.classList.remove(cls);
      }
    });
  });
  
  console.log('🎨 CSS 수집 시작...');
  
  // 1. 모든 CSS 수집 및 외부 CSS 보존
  await collectAndEmbedAllCSS(html);
  
  console.log('🎨 인라인 스타일 보존...');
  
  // 2. 인라인 스타일은 이미 복사되어 있음
  
  // 3. 이미지 처리
  console.log('🖼️ 이미지 처리 시작...');
  await downloadAndReplaceImages(html);
  
  // 4. CSS 배경 이미지 처리
  await processCSSBackgroundImages(html);
  
  // 5. 외부 리소스 처리
  processExternalResources(html);
  
  // 6. 최소한의 보정 CSS 추가
  const minimalFixCSS = document.createElement('style');
  minimalFixCSS.setAttribute('data-wcs-minimal-fix', 'true');
  minimalFixCSS.textContent = `
    /* 최소한의 보정 CSS */
    img { max-width: 100%; height: auto; }
    .blind, .u_skip { position: absolute !important; clip: rect(0,0,0,0) !important; }
  `;
  html.querySelector('head').appendChild(minimalFixCSS);
  
  // DOCTYPE 포함한 완전한 HTML 반환
  return '<!DOCTYPE html>\n' + html.outerHTML;
}

async function createSelectionHTML() {
  console.log('🔍 createSelectionHTML 시작');
  
  // 선택된 요소들을 DOM 순서대로 정렬
  const sortedElements = Array.from(selectedElements).sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  
  console.log(`🔍 정렬된 요소 수: ${sortedElements.length}`);
  
  // 각 선택된 요소를 개별적으로 처리하되, 구조를 유지
  const processedElements = await Promise.all(sortedElements.map(async (element, index) => {
    console.log(`🔍 요소 ${index + 1} 처리 중: ${element.tagName}${element.id ? '#' + element.id : ''}`);
    
    const cloned = element.cloneNode(true);
    // 선택 관련 클래스 제거
    cloned.classList.remove('wcs-hover', 'wcs-selected', 'wcs-selectable');
    
    // 이미지 다운로드 및 경로 변경
    await downloadAndReplaceImages(cloned);
    
    const htmlContent = cloned.outerHTML;
    console.log(`🔍 요소 ${index + 1} HTML 길이: ${htmlContent.length}자`);
    
    // 각 요소를 컨테이너로 감싸서 구조 보존
    return `<div class="selected-content-item">${htmlContent}</div>`;
  }));
  
  const selectedHTML = processedElements.join('\n\n');
  
  console.log(`🔍 전체 선택된 HTML 길이: ${selectedHTML.length}자`);
  
  // 현재 페이지의 모든 스타일 수집 (외부 CSS 포함)
  let allCSS = '';
  
  const styleSheets = Array.from(document.styleSheets);
  for (const sheet of styleSheets) {
    try {
      if (sheet.cssRules && sheet.cssRules.length > 0) {
        // 내부 스타일 또는 접근 가능한 외부 스타일
        Array.from(sheet.cssRules).forEach(rule => {
          allCSS += rule.cssText + '\n';
        });
      } else if (sheet.href) {
        // 외부 CSS 파일 다운로드 시도
        try {
          const response = await fetch(sheet.href);
          if (response.ok) {
            const cssContent = await response.text();
            allCSS += cssContent + '\n';
            console.log(`✅ 선택 영역용 외부 CSS 다운로드: ${sheet.href}`);
          }
        } catch (error) {
          console.warn(`⚠️ 선택 영역용 외부 CSS 페치 실패: ${sheet.href}`);
        }
      }
    } catch (e) {
      // CORS 제한으로 인한 접근 불가
    }
  }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Selected Content - ${document.title}</title>
  <style>
    /* 기본 레이아웃 스타일 */
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      margin: 20px;
      padding: 20px;
      background: white;
    }
    
    .source-info {
      background: #f5f5f5;
      padding: 10px;
      margin-bottom: 20px;
      border-left: 4px solid #2196F3;
      font-size: 12px;
    }
    
    .selected-content-item {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
      /* 레이아웃 보존을 위한 기본 스타일 */
      position: relative;
      overflow: visible;
    }
    
    .selected-content-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    /* 이미지 반응형 처리 */
    .selected-content-item img {
      max-width: 100%;
      height: auto;
    }
    
    /* Flexbox 레이아웃 보존 */
    .selected-content-item [style*="display: flex"],
    .selected-content-item [class*="flex"],
    .selected-content-item [class*="d-flex"] {
      display: flex !important;
    }
    
    /* Grid 레이아웃 보존 */
    .selected-content-item [style*="display: grid"],
    .selected-content-item [class*="grid"] {
      display: grid !important;
    }
    
    /* 원본 페이지의 모든 스타일 */
    ${allCSS}
    
    /* 레이아웃 안정성을 위한 추가 스타일 */
    .selected-content-item [style*="position: absolute"] {
      position: relative !important;
    }
    
    .selected-content-item [style*="position: fixed"] {
      position: relative !important;
    }
    
    /* 네이버 등 특정 사이트 대응 */
    .selected-content-item .blind,
    .selected-content-item [style*="overflow: hidden"][style*="width: 1px"] {
      position: static !important;
      width: auto !important;
      height: auto !important;
      overflow: visible !important;
      clip: none !important;
    }
  </style>
</head>
<body>
  <div class="source-info">
    <strong>출처:</strong> ${window.location.href}<br>
    <strong>저장 일시:</strong> ${new Date().toLocaleString()}<br>
    <strong>선택된 요소 수:</strong> ${selectedElements.size}개
  </div>
  <div class="selected-content">
    ${selectedHTML}
  </div>
</body>
</html>`;
  
  return html;
}

function processExternalResources(html) {
  try {
    removeThirdPartyElements(html);
    
    const images = html.querySelectorAll('img');
    images.forEach(img => {
      try {
        if (img.src && !img.src.startsWith('data:')) {
          if (img.naturalWidth === 0 && img.complete) {
            createImagePlaceholder(img);
          } else {
            const imgUrl = new URL(img.src);
            const currentUrl = new URL(window.location.href);
            
            if (imgUrl.origin === currentUrl.origin) {
              convertImageToBase64(img);
            } else {
              img.crossOrigin = 'anonymous';
              img.referrerPolicy = 'no-referrer';
            }
          }
        }
      } catch (e) {
        createImagePlaceholder(img);
      }
    });
    
    const externalLinks = html.querySelectorAll('link[rel="stylesheet"]');
    externalLinks.forEach(link => {
      try {
        if (link.href && !link.href.startsWith(window.location.origin)) {
          link.setAttribute('crossorigin', 'anonymous');
          link.setAttribute('referrerpolicy', 'no-referrer');
        }
      } catch (e) {
        // 무시
      }
    });
    
  } catch (e) {
    console.warn('외부 리소스 처리 중 오류:', e.message);
  }
}

function removeThirdPartyElements(html) {
  try {
    const thirdPartySelectors = [
      'script',
      '[id*="drift"]', '[class*="drift"]',
      '[id*="intercom"]', '[class*="intercom"]',
      '[id*="zendesk"]', '[class*="zendesk"]',
      '[id*="tawk"]', '[class*="tawk"]',
      '[id*="crisp"]', '[class*="crisp"]',
      '[id*="hotjar"]', '[class*="hotjar"]',
      '[id*="gtag"]', '[class*="gtag"]',
      'iframe[src*="drift.com"]',
      'iframe[src*="intercom.io"]',
      'iframe[src*="zendesk.com"]',
      '.fb-customerchat',
      '#fb-root'
    ];

    thirdPartySelectors.forEach(selector => {
      try {
        const elements = html.querySelectorAll(selector);
        elements.forEach(element => {
          try {
            element.remove();
          } catch (e) {
            // 무시
          }
        });
      } catch (e) {
        // 무시
      }
    });

  } catch (e) {
    console.warn('타사 요소 제거 중 오류:', e.message);
  }
}

function createImagePlaceholder(img) {
  try {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      display: inline-block;
      width: ${img.width || 100}px;
      height: ${img.height || 50}px;
      background: #f0f0f0;
      border: 1px solid #ddd;
      text-align: center;
      line-height: ${img.height || 50}px;
      font-size: 12px;
      color: #666;
    `;
    placeholder.textContent = img.alt || '이미지';
    img.parentNode?.replaceChild(placeholder, img);
  } catch (e) {
    // 무시
  }
}

function convertImageToBase64(img) {
  try {
    if (!img.complete || img.naturalWidth === 0) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth || img.width || 100;
    canvas.height = img.naturalHeight || img.height || 100;
    
    ctx.drawImage(img, 0, 0);
    
    try {
      const dataURL = canvas.toDataURL('image/png');
      img.src = dataURL;
    } catch (canvasError) {
      // CORS 오류 무시
    }
    
  } catch (e) {
    // 무시
  }
}

function downloadContent(content, filename) {
  try {
    console.log(`🔍 downloadContent 시작 - 파일명: ${filename}, 내용 길이: ${content.length}자`);
    
    // Chrome Downloads API를 통한 다운로드
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    console.log('🔍 Blob 생성 완료, background script로 다운로드 요청 중...');
    
    // background script로 다운로드 요청
    chrome.runtime.sendMessage({
      action: 'downloadFile',
      url: url,
      filename: filename
    }, async (response) => {
      URL.revokeObjectURL(url);
      if (response && response.success) {
        console.log('✅ Web Content Saver: HTML 파일 다운로드 완료 -', filename);
        console.log('🔍 HTML 파일 경로:', response.filePath);
        
        // HTML 파일의 디렉토리 정보를 전역 변수에 저장
        window.htmlFileDirectory = response.filePath.replace(/[^\\\/]+$/, ''); // 파일명 제거하여 디렉토리만
        console.log('📁 HTML 파일 디렉토리:', window.htmlFileDirectory);
        
        // PDF 변환 시도
        await tryConvertToPdf(response.filePath, filename);
      } else {
        console.error('❌ Web Content Saver: 다운로드 실패:', response?.error || '알 수 없는 오류');
        // 실패시 기존 방식으로 시도
        fallbackDownload(content, filename);
      }
    });
    
  } catch (error) {
    console.error('Web Content Saver: 다운로드 오류 -', error.message);
    // 실패시 기존 방식으로 시도
    fallbackDownload(content, filename);
  }
}

// PDF 변환 API 호출 함수
async function tryConvertToPdf(htmlFilePath, originalFilename) {
  try {
    console.log('🔍 PDF 변환 서버 상태 확인 중...');
    
    // 서버 상태 확인을 건너뛰고 바로 PDF 변환 시도
    console.log('✅ PDF 변환 서버로 직접 요청을 보냅니다.');
    
    // PDF 파일명 생성 (확장자를 .pdf로 변경)
    const pdfFilename = originalFilename.replace(/\.html?$/i, '.pdf');
    
    console.log('🔍 PDF 변환 요청 중...');
    console.log(`  - HTML 파일: ${htmlFilePath}`);
    console.log(`  - PDF 파일명: ${pdfFilename}`);
    
    // 전송할 JSON 데이터 준비
    const requestData = {
      html_file_path: htmlFilePath,
      output_filename: pdfFilename
    };
    
    console.log('🔍 전송할 JSON 데이터:', JSON.stringify(requestData, null, 2));
    console.log('🔍 POST 요청 URL: http://localhost:5000/convert-to-pdf');
    console.log('🔍 요청 메서드: POST');
    console.log('🔍 요청 헤더: Content-Type: application/json');
    console.log('🔍 요청 바디 길이:', JSON.stringify(requestData).length, '바이트');
    
    // PDF 변환 요청
    console.log('🚀 POST 요청 전송 시작...');
    
    console.log('🔍 background script를 통해 PDF 변환 요청 전송...');
    
    // background script를 통해 PDF 변환 요청
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'convertToPdf',
        data: requestData
      }, resolve);
    });
    
    console.log('📥 background script 응답:', response);
    
    if (response && response.success) {
      console.log('✅ PDF 변환 성공:', response.result);
    } else {
      console.error('❌ PDF 변환 실패:', response?.error || '알 수 없는 오류');
    }
    
  } catch (error) {
    console.error('❌ PDF 변환 중 오류 발생:', error.message);
    console.log('ℹ️ HTML 파일은 정상적으로 저장되었습니다.');
  }
}

// 대체 다운로드 방식
function fallbackDownload(content, filename) {
  try {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // 강제로 다운로드 트리거
    a.click();
    
    // 정리
    setTimeout(async () => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // 대체 다운로드 후에도 PDF 변환 시도 (기본 다운로드 폴더 경로 추정)
      const defaultDownloadPath = await getDefaultDownloadPath(filename);
      if (defaultDownloadPath) {
        await tryConvertToPdf(defaultDownloadPath, filename);
      }
    }, 100);
    
    console.log('✅ Web Content Saver: 대체 다운로드 완료 -', filename);
    
  } catch (error) {
    console.error('Web Content Saver: 대체 다운로드도 실패:', error.message);
    
    // 마지막 수단: 새창으로 열기
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (newWindow) {
      console.log('ℹ️ Web Content Saver: 새 창에서 열림. 수동으로 저장하세요.');
      // 사용자에게 수동 저장 안내
      setTimeout(() => {
        alert('파일을 저장하려면 새로 열린 창에서 Ctrl+S를 눌러 저장하세요.');
      }, 1000);
    }
  }
}

function sanitizeFilename(filename) {
  return filename.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
}

// 이미지 다운로드 및 경로 변경 함수 (강화 버전)
async function downloadAndReplaceImages(element) {
  const images = element.querySelectorAll('img');
  const title = document.title || 'webpage';
  const folderName = `${sanitizeFilename(title)}_files`;
  
  console.log(`🖼️ 이미지 다운로드 시작 - 총 ${images.length}개 이미지 발견`);
  
  // 이미지를 크기별로 분류 (favicon 등 작은 이미지 구분)
  const imageArray = Array.from(images);
  const smallImages = [];
  const normalImages = [];
  
  imageArray.forEach((img, index) => {
    const width = img.width || img.naturalWidth || 0;
    const height = img.height || img.naturalHeight || 0;
    const isSmall = (width <= 32 && height <= 32) || img.src.includes('favicon');
    
    if (isSmall) {
      smallImages.push({ img, index });
    } else {
      normalImages.push({ img, index });
    }
  });
  
  console.log(`📊 이미지 분류: 작은 이미지 ${smallImages.length}개, 일반 이미지 ${normalImages.length}개`);
  
  // 작은 이미지 (favicon 등) 먼저 처리 - 더 적극적인 방법 사용
  for (const { img, index } of smallImages) {
    await processSingleImage(img, index, folderName, imageArray.length, true); // isSmall = true
  }
  
  // 일반 이미지 병렬 처리
  const CONCURRENT_LIMIT = 5;
  
  for (let i = 0; i < normalImages.length; i += CONCURRENT_LIMIT) {
    const batch = normalImages.slice(i, i + CONCURRENT_LIMIT);
    const batchPromises = batch.map(async ({ img, index }) => {
      return await processSingleImage(img, index, folderName, imageArray.length, false); // isSmall = false
    });
    
    await Promise.all(batchPromises);
    
    // 배치 간 잠시 대기 (서버 부하 방지)
    if (i + CONCURRENT_LIMIT < normalImages.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`🖼️ 이미지 처리 완료`);
}

// 개별 이미지 처리 함수
async function processSingleImage(img, index, folderName, totalCount, isSmallImage = false) {
  try {
    // data URL이나 blob URL은 이미 처리된 것으로 건너뛰기
    if (!img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) {
      return;
    }
    
    // 절대 URL 생성
    let imageUrl;
    try {
      imageUrl = new URL(img.src, window.location.href).href;
    } catch (e) {
      console.warn(`❌ 잘못된 이미지 URL: ${img.src}`);
      return;
    }
    
    // 파일명 생성 및 확장자 처리
    const urlParts = new URL(imageUrl);
    let filename = urlParts.pathname.split('/').pop() || `image_${index}`;
    
    // 쿼리 파라미터 제거
    filename = filename.split('?')[0];
    
    // 확장자 검사 및 추가
    if (!filename.includes('.') || filename.endsWith('.')) {
      // Content-Type 추정 또는 기본 확장자
      if (imageUrl.toLowerCase().includes('gif')) {
        filename += '.gif';
      } else if (imageUrl.toLowerCase().includes('png')) {
        filename += '.png';
      } else if (imageUrl.toLowerCase().includes('webp')) {
        filename += '.webp';
      } else if (imageUrl.toLowerCase().includes('svg')) {
        filename += '.svg';
      } else {
        filename += '.jpg'; // 기본값
      }
    }
    
    // 파일명 정리
    const nameParts = filename.split('.');
    const extension = nameParts.pop();
    const cleanName = sanitizeFilename(nameParts.join('.'));
    filename = `img_${String(index).padStart(3, '0')}_${cleanName}.${extension}`;
    
    const relativePath = `${folderName}/${filename}`;
    
    const imageType = isSmallImage ? '작은 이미지(favicon 등)' : '일반 이미지';
    console.log(`📥 ${imageType} 처리 중 [${index + 1}/${totalCount}]: ${filename}`);
    console.log(`🌐 원본 URL: ${imageUrl}`);
    console.log(`📁 상대 경로: ${relativePath}`);
    
    // 이미지 원본 속성 보존
    const originalAlt = img.alt || '';
    const originalTitle = img.title || '';
    const originalClass = img.className || '';
    const originalStyle = img.getAttribute('style') || '';
    const originalWidth = img.width || img.naturalWidth || 0;
    const originalHeight = img.height || img.naturalHeight || 0;
    
    console.log(`📐 원본 이미지 크기: ${originalWidth}x${originalHeight}`);
    console.log(`🏷️ 이미지 속성 - alt: "${originalAlt}", title: "${originalTitle}"`);
    
    // 더 적극적인 이미지 처리 - Base64 우선
    let imageProcessed = false;
    let processingMethod = '';
    
    // 작은 이미지(favicon 등)는 더 적극적으로 처리
    if (isSmallImage) {
      console.log(`🔄 작은 이미지 특별 처리: Base64 변환 (더 적극적)...`);
      
      // Google Favicon API의 경우 특별 처리
      if (imageUrl.includes('google.com/s2/favicons')) {
        console.log(`🌟 Google Favicon API 감지`);
        console.log(`🔍 원본 URL: ${imageUrl}`);
        
        // Google Favicon API 대안 URL 시도
        const domain = imageUrl.match(/domain=([^&]+)/)?.[1];
        if (domain) {
          const alternativeUrls = [
            `https://www.google.com/s2/favicons?domain=${domain}`,
            `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
            `https://favicon.yandex.net/favicon/${domain}`,
            `https://icons.duckduckgo.com/ip3/${domain}.ico`
          ];
          
          console.log(`🔄 도메인 "${domain}"에 대한 대안 favicon URL들 준비`);
          
          // 각 대안 URL 시도
          for (let i = 0; i < alternativeUrls.length; i++) {
            const altUrl = alternativeUrls[i];
            console.log(`🔄 대안 favicon URL [${i+1}/${alternativeUrls.length}]: ${altUrl}`);
            
            const base64Result = await fetchImageAsBase64(altUrl);
            if (base64Result && 
                base64Result.startsWith('data:image/') && 
                base64Result.length > 50 &&
                base64Result.includes(',') && 
                base64Result.split(',')[1].length > 10) {
              
              img.src = base64Result;
              img.setAttribute('data-original-src', imageUrl);
              img.setAttribute('data-alternative-src', altUrl);
              img.setAttribute('data-wcs-embedded', 'true');
              processingMethod = `Favicon 대안 URL (${i+1})`;
              console.log(`✅ Favicon 대안 URL 성공: ${altUrl}`);
              imageProcessed = true;
              break;
            }
          }
        }
      }
    } else {
      console.log(`🔄 1차 시도: Base64 변환...`);
    }
    
    // 아직 처리되지 않은 경우 일반 Base64 변환 시도
    if (!imageProcessed) {
      // Base64 변환 시도 (작은 이미지는 더 많은 재시도)
      const maxRetries = isSmallImage ? 3 : 1;
      let base64Data = null;
      
      for (let retry = 0; retry < maxRetries; retry++) {
        if (retry > 0) {
          console.log(`🔄 Base64 재시도 [${retry + 1}/${maxRetries}]: ${filename}`);
        }
        
        base64Data = await fetchImageAsBase64(imageUrl);
        if (base64Data) break;
        
        // 재시도 간격
        if (retry < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    
      // Base64 데이터 유효성 검사 강화
      if (base64Data && 
          base64Data.startsWith('data:image/') && 
          base64Data.length > 50 &&  // 최소 길이 체크
          base64Data.includes(',') && 
          base64Data.split(',')[1].length > 10) { // 실제 데이터가 있는지 확인
        
        img.src = base64Data;
        img.setAttribute('data-original-src', imageUrl);
        img.setAttribute('data-wcs-embedded', 'true');
        processingMethod = 'Base64 임베딩';
        console.log(`✅ Base64 임베딩 성공: ${filename} (${Math.round(base64Data.length/1024)}KB)`);
        console.log(`📋 Base64 헤더: ${base64Data.substring(0, 50)}...`);
        imageProcessed = true;
      } else {
        console.log(`❌ Base64 변환 실패 또는 빈 데이터`);
        if (base64Data) {
          console.log(`📋 받은 데이터: ${base64Data.substring(0, 100)}...`);
          console.log(`📏 데이터 길이: ${base64Data.length}`);
        }
      }
    }
    
    // 아직 처리되지 않은 경우 원본 URL 직접 사용
    if (!imageProcessed) {
      // 2차: 원본 URL 직접 사용 (Base64 실패 시)
      console.log(`🔄 최종 시도: 원본 URL 직접 사용...`);
      
      // 원본 URL을 그대로 사용하되 CORS 설정 추가
      img.src = imageUrl;
      img.setAttribute('crossorigin', 'anonymous');
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.setAttribute('data-original-src', imageUrl);
      img.setAttribute('data-wcs-fallback', 'true');
      processingMethod = '원본 URL 직접 사용';
      
      console.log(`🌐 원본 URL 직접 사용 설정: ${filename}`);
      
      // 이미지 로드 확인
      const imageLoadPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ 이미지 로드 타임아웃: ${filename}`);
          resolve(false);
        }, 5000);
        
        img.onload = function() {
          clearTimeout(timeout);
          console.log(`✅ 원본 URL 이미지 로드 성공: ${filename}`);
          resolve(true);
        };
        
        img.onerror = function() {
          clearTimeout(timeout);
          console.log(`❌ 원본 URL 이미지 로드 실패: ${filename}`);
          resolve(false);
        };
      });
      
      const loadSuccess = await imageLoadPromise;
      if (loadSuccess) {
        imageProcessed = true;
      } else {
        // 로드 실패 시 플레이스홀더로 대체
        processingMethod = '플레이스홀더 생성 (원본 URL 실패)';
        createAdvancedImagePlaceholder(img, imageUrl, filename);
        imageProcessed = true;
      }
    }
    
    // 처리 완료 (위의 2차 시도에서 모든 경우를 처리함)
    
    // 원본 속성 복원
    if (originalAlt) img.alt = originalAlt;
    if (originalTitle) img.title = originalTitle;
    if (originalClass) img.className = originalClass;
    if (originalStyle) img.setAttribute('style', originalStyle);
    
    // 최종 처리 결과 로그
    console.log(`🎯 이미지 처리 완료 [${index + 1}/${totalCount}]: ${filename}`);
    console.log(`📋 처리 방법: ${processingMethod}`);
    console.log(`🔗 최종 src: ${img.src.substring(0, 100)}${img.src.length > 100 ? '...' : ''}`);
    
  } catch (error) {
    console.error(`❌ 이미지 처리 오류 [${index}]: ${error.message}`);
    // 오류 시에도 플레이스홀더 생성
    createAdvancedImagePlaceholder(img, img.src, `image_${index}_error`);
  }
}

// 고급 이미지 플레이스홀더 생성
function createAdvancedImagePlaceholder(img, originalUrl, filename) {
  try {
    // 원본 이미지 크기 추정
    const width = img.width || img.naturalWidth || 200;
    const height = img.height || img.naturalHeight || 150;
    
    // 더 많은 정보를 포함한 SVG 플레이스홀더 생성
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <text x="50%" y="35%" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#495057" font-weight="bold">
          🖼️ 이미지
        </text>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#6c757d">
          ${filename || '이미지 파일'}
        </text>
        <text x="50%" y="65%" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#adb5bd">
          ${width}×${height}
        </text>
        <text x="50%" y="80%" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#ced4da">
          원본: ${originalUrl ? originalUrl.substring(0, 40) + (originalUrl.length > 40 ? '...' : '') : 'N/A'}
        </text>
      </svg>
    `;
    
    const svgPlaceholder = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    
    img.src = svgPlaceholder;
    img.setAttribute('data-wcs-placeholder', 'true');
    img.setAttribute('data-original-url', originalUrl);
    img.style.border = '1px dashed #ccc';
    
  } catch (error) {
    // SVG 생성도 실패한 경우 기본 플레이스홀더
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiI+7J207Jig7KeAPC90ZXh0Pjwvc3ZnPg==';
  }
}

// 이미지를 Base64로 변환 (개선된 버전)
async function fetchImageAsBase64(url) {
  try {
    console.log(`🖼️ Base64 변환 시도: ${url}`);
    
    // Canvas 방식을 우선 시도 (더 안정적)
    const canvasResult = await convertImageViaCanvas(url);
    if (canvasResult) {
      console.log(`✅ Canvas 변환 성공: ${url.substring(url.lastIndexOf('/') + 1)}`);
      return canvasResult;
    }
    
    // Canvas 실패 시 fetch 시도
    console.log(`🔄 Fetch 방식으로 재시도: ${url}`);
    
    let response;
    
    try {
      // 동일 오리진 이미지만 CORS fetch 시도
      const imageUrl = new URL(url, window.location.href);
      const currentUrl = new URL(window.location.href);
      
      if (imageUrl.origin === currentUrl.origin) {
        // 같은 도메인이면 fetch 시도
        response = await fetch(url, {
          mode: 'cors',
          credentials: 'same-origin',
          cache: 'force-cache'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          console.log(`📁 이미지 타입: ${blob.type}, 크기: ${blob.size}bytes`);
          
          // blob 크기 검증
          if (blob.size === 0) {
            console.warn(`⚠️ 빈 blob 데이터: ${url}`);
            return null;
          }
          
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result;
              
              // 결과 검증
              if (!result || !result.startsWith('data:') || result.length < 50) {
                console.warn(`⚠️ 잘못된 Base64 데이터: ${url} (길이: ${result?.length || 0})`);
                resolve(null);
                return;
              }
              
              // data URL에서 실제 데이터 부분 확인
              const dataPart = result.split(',')[1];
              if (!dataPart || dataPart.length < 10) {
                console.warn(`⚠️ Base64 데이터 부족: ${url}`);
                resolve(null);
                return;
              }
              
              console.log(`✅ Fetch Base64 변환 완료: ${url.substring(url.lastIndexOf('/') + 1)} (${Math.round(result.length / 1024)}KB)`);
              resolve(result);
            };
            reader.onerror = () => {
              console.warn(`❌ FileReader 오류: ${url}`);
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch (fetchError) {
      console.log(`Fetch 실패: ${fetchError.message}`);
    }
    
    // 모든 방법 실패
    console.warn(`⚠️ 모든 Base64 변환 방법 실패: ${url}`);
    return null;
    
  } catch (error) {
    console.warn(`⚠️ Base64 변환 오류: ${url} - ${error.message}`);
    return null;
  }
}

// Canvas를 이용한 이미지 변환 (강화된 버전)
async function convertImageViaCanvas(url) {
  return new Promise((resolve) => {
    try {
      console.log(`🎨 Canvas 변환 시도: ${url}`);
      
      const img = new Image();
      
      // 다양한 CORS 설정 시도
      const corsSettings = ['anonymous', 'use-credentials', ''];
      let currentSettingIndex = 0;
      
      function tryNextCORSSetting() {
        if (currentSettingIndex < corsSettings.length) {
          img.crossOrigin = corsSettings[currentSettingIndex];
          console.log(`🔄 CORS 설정 시도 [${currentSettingIndex + 1}/${corsSettings.length}]: "${img.crossOrigin}"`);
          currentSettingIndex++;
          
          // 짧은 지연 후 이미지 로드 시도
          setTimeout(() => {
            img.src = url;
          }, 100);
        } else {
          console.warn(`❌ 모든 CORS 설정 실패: ${url}`);
          resolve(null);
        }
      }
      
      img.onload = function() {
        try {
          console.log(`✅ 이미지 로드 성공: ${url} (${img.naturalWidth}x${img.naturalHeight})`);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          
          console.log(`🎨 Canvas 크기 설정: ${canvas.width}x${canvas.height}`);
          
          // 배경을 흰색으로 설정 (투명 이미지 대응)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 이미지 그리기
          ctx.drawImage(img, 0, 0);
          
          // PNG로 변환 (품질 최대)
          const dataURL = canvas.toDataURL('image/png', 1.0);
          
          // 결과 검증
          if (!dataURL || !dataURL.startsWith('data:image/') || dataURL.length < 50) {
            console.warn(`⚠️ Canvas 변환 결과 검증 실패: ${url}`);
            resolve(null);
            return;
          }
          
          // data URL에서 실제 데이터 부분 확인
          const dataPart = dataURL.split(',')[1];
          if (!dataPart || dataPart.length < 10) {
            console.warn(`⚠️ Canvas Base64 데이터 부족: ${url}`);
            resolve(null);
            return;
          }
          
          const sizeKB = Math.round(dataURL.length / 1024);
          console.log(`✅ Canvas 변환 완료: ${url.substring(url.lastIndexOf('/') + 1)} (${sizeKB}KB)`);
          resolve(dataURL);
        } catch (canvasError) {
          console.warn(`❌ Canvas 변환 실패: ${canvasError.message}`);
          resolve(null);
        }
      };
      
      img.onerror = function(event) {
        console.warn(`⚠️ 이미지 로드 오류 [설정: "${img.crossOrigin}"]: ${url}`);
        // 다음 CORS 설정으로 재시도
        tryNextCORSSetting();
      };
      
      // 전체 타임아웃 설정 (10초)
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ 이미지 로드 타임아웃: ${url}`);
        resolve(null);
      }, 10000);
      
      // 성공 시 타임아웃 해제
      const originalOnLoad = img.onload;
      img.onload = function() {
        clearTimeout(timeoutId);
        originalOnLoad.call(this);
      };
      
      // 첫 번째 CORS 설정으로 시작
      tryNextCORSSetting();
      
    } catch (error) {
      console.warn(`❌ Canvas 변환 초기화 오류: ${error.message}`);
      resolve(null);
    }
  });
}

// 이미지 파일 다운로드 요청
async function downloadImageFile(url, filepath) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'downloadFile',
      url: url,
      filename: filepath
    }, (response) => {
      if (response && response.success) {
        console.log(`✅ 이미지 다운로드 성공: ${filepath}`);
        console.log(`📁 실제 저장 경로: ${response.filePath}`);
        resolve(response.filePath || filepath); // 실제 저장 경로 반환
      } else {
        console.warn(`⚠️ 이미지 다운로드 실패: ${filepath} - ${response?.error}`);
        resolve(false);
      }
    });
  });
}

// CSS 수집 및 임베드 함수
async function collectAndEmbedAllCSS(html) {
  const styleSheets = Array.from(document.styleSheets);
  console.log(`🎨 총 ${styleSheets.length}개 스타일시트 처리 중...`);
  
  // 기존 <link> 태그들을 모두 수집
  const existingLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  console.log(`🔗 ${existingLinks.length}개 링크 태그 발견`);
  
  // 링크 태그들을 HTML에 복사
  existingLinks.forEach(link => {
    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = link.href;
    if (link.media) newLink.media = link.media;
    if (link.type) newLink.type = link.type;
    html.querySelector('head').appendChild(newLink);
    console.log(`✅ 링크 복사: ${link.href}`);
  });
  
  // 인라인 스타일 수집
  const inlineStyles = Array.from(document.querySelectorAll('style'));
  console.log(`📝 ${inlineStyles.length}개 인라인 스타일 발견`);
  
  inlineStyles.forEach((style, index) => {
    const newStyle = document.createElement('style');
    newStyle.textContent = style.textContent;
    if (style.media) newStyle.media = style.media;
    if (style.type) newStyle.type = style.type;
    html.querySelector('head').appendChild(newStyle);
    console.log(`✅ 인라인 스타일 ${index + 1} 복사 완료`);
  });
  
  // 접근 가능한 스타일시트의 규칙들을 수집
  let additionalCSS = '';
  
  for (const sheet of styleSheets) {
    try {
      if (sheet.cssRules) {
        const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        additionalCSS += `\n/* From: ${sheet.href || 'inline'} */\n${rules}\n`;
        console.log(`✅ CSS 규칙 수집: ${sheet.href || 'inline'} (${rules.length}자)`);
      }
    } catch (e) {
      // CORS 제한으로 접근 불가한 경우 무시
      console.log(`⚠️ CSS 규칙 접근 불가: ${sheet.href}`);
    }
  }
  
  // 수집된 추가 CSS가 있으면 추가
  if (additionalCSS) {
    const additionalStyle = document.createElement('style');
    additionalStyle.setAttribute('data-wcs-additional', 'true');
    additionalStyle.textContent = additionalCSS;
    html.querySelector('head').appendChild(additionalStyle);
    console.log(`🎨 추가 CSS 임베드 완료 (${additionalCSS.length}자)`);
  }
}

// 인라인 스타일 보존
function preserveInlineStyles(html) {
  const elementsWithStyle = html.querySelectorAll('[style]');
  console.log(`🎨 인라인 스타일 보존: ${elementsWithStyle.length}개 요소`);
  
  elementsWithStyle.forEach(element => {
    const style = element.getAttribute('style');
    if (style && style.trim()) {
      // 인라인 스타일이 손실되지 않도록 보장
      element.setAttribute('style', style);
      element.setAttribute('data-wcs-inline-style', 'preserved');
    }
  });
}

// 완전한 스타일 복제 (모든 computed styles를 CSS로 생성)
async function preserveComputedStyles(html) {
  console.log('🎨 완전한 스타일 복제 시작');
  
  const allElements = document.querySelectorAll('*');
  console.log(`🎨 ${allElements.length}개 요소 처리 중...`);
  
  let completeCSS = '/* 완전한 Computed Styles 복제 */\n';
  
  // 모든 요소의 computed style을 CSS 규칙으로 변환
  allElements.forEach((element, index) => {
    try {
      const computed = window.getComputedStyle(element);
      const tagName = element.tagName.toLowerCase();
      
      // 고유한 클래스명 생성
      const uniqueClass = `wcs-element-${index}`;
      element.classList.add(uniqueClass);
      
      // HTML에서 동일한 요소 찾기
      const htmlElements = html.querySelectorAll('*');
      if (htmlElements[index] && htmlElements[index].tagName === element.tagName) {
        htmlElements[index].classList.add(uniqueClass);
        
        // 모든 CSS 속성을 복사 (중요한 것들만 선별)
        const importantStyles = [
          // 레이아웃
          'display', 'position', 'top', 'left', 'right', 'bottom', 'z-index',
          'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
          'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
          'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
          'border', 'border-width', 'border-style', 'border-color',
          'border-top', 'border-right', 'border-bottom', 'border-left',
          'border-radius', 'box-sizing',
          
          // 배경
          'background', 'background-color', 'background-image', 'background-size', 
          'background-position', 'background-repeat', 'background-attachment',
          
          // 플렉스박스
          'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
          'justify-content', 'align-items', 'align-content', 'align-self', 'order',
          
          // 그리드
          'grid', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
          'grid-column', 'grid-row', 'grid-gap', 'gap', 'grid-auto-columns', 'grid-auto-rows',
          
          // 텍스트 및 폰트
          'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
          'color', 'text-align', 'text-decoration', 'text-transform', 'letter-spacing',
          'word-spacing', 'white-space', 'text-indent', 'vertical-align',
          
          // 기타
          'float', 'clear', 'overflow', 'overflow-x', 'overflow-y', 'visibility',
          'opacity', 'transform', 'transition', 'cursor', 'outline'
        ];
        
        let elementCSS = `.${uniqueClass} {\n`;
        let hasValidStyle = false;
        
        importantStyles.forEach(prop => {
          try {
            const value = computed.getPropertyValue(prop);
            if (value && 
                value !== 'auto' && 
                value !== 'normal' && 
                value !== 'initial' && 
                value !== 'unset' &&
                value !== 'none' && 
                value !== '0px' &&
                value !== 'rgba(0, 0, 0, 0)' &&
                value !== 'transparent' &&
                value.trim() !== '') {
              
              elementCSS += `  ${prop}: ${value} !important;\n`;
              hasValidStyle = true;
            }
          } catch (e) {
            // 속성 접근 오류 무시
          }
        });
        
        elementCSS += '}\n\n';
        
        if (hasValidStyle) {
          completeCSS += elementCSS;
        }
      }
    } catch (error) {
      console.warn(`⚠️ 요소 ${index} 스타일 처리 실패: ${error.message}`);
    }
  });
  
  // 생성된 CSS를 HTML에 추가
  if (completeCSS.length > 100) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-wcs-complete-styles', 'true');
    styleElement.textContent = completeCSS;
    html.querySelector('head').appendChild(styleElement);
    
    console.log(`🎨 완전한 스타일 복제 완료 (${completeCSS.length}자)`);
  }
}

// CSS 배경 이미지 처리
async function processCSSBackgroundImages(html) {
  const elementsWithBg = html.querySelectorAll('*');
  const title = document.title || 'webpage';
  const folderName = `${sanitizeFilename(title)}_files`;
  
  console.log(`🖼️ CSS 배경 이미지 처리 시작...`);
  
  const bgImagePromises = [];
  
  elementsWithBg.forEach((element, index) => {
    const style = element.getAttribute('style') || '';
    const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
    
    if (bgImageMatch) {
      const imageUrl = bgImageMatch[1];
      
      if (!imageUrl.startsWith('data:')) {
        bgImagePromises.push(
          processSingleBackgroundImage(element, imageUrl, index, folderName)
        );
      }
    }
  });
  
  await Promise.all(bgImagePromises);
  
  console.log(`🖼️ CSS 배경 이미지 처리 완료`);
}

// 개별 배경 이미지 처리
async function processSingleBackgroundImage(element, imageUrl, index, folderName) {
  try {
    let absoluteUrl;
    try {
      absoluteUrl = new URL(imageUrl, window.location.href).href;
    } catch (e) {
      console.warn(`❌ 잘못된 배경 이미지 URL: ${imageUrl}`);
      return;
    }
    
    const filename = `bg_img_${index}_${imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg'}`;
    const sanitizedFilename = sanitizeFilename(filename.split('.')[0]) + '.' + filename.split('.').pop();
    const relativePath = `${folderName}/${sanitizedFilename}`;
    
    // Base64 변환 시도
    const base64Data = await fetchImageAsBase64(absoluteUrl);
    if (base64Data) {
      // Base64로 임베드
      const currentStyle = element.getAttribute('style') || '';
      const newStyle = currentStyle.replace(
        /background-image:\s*url\(['"]?[^'")]+['"]?\)/i,
        `background-image: url('${base64Data}')`
      );
      element.setAttribute('style', newStyle);
      console.log(`✅ CSS 배경 이미지 임베드 완료: ${filename}`);
    } else {
      // 별도 파일로 다운로드
      await downloadImageFile(absoluteUrl, relativePath);
      const currentStyle = element.getAttribute('style') || '';
      const newStyle = currentStyle.replace(
        /background-image:\s*url\(['"]?[^'")]+['"]?\)/i,
        `background-image: url('${relativePath}')`
      );
      element.setAttribute('style', newStyle);
      console.log(`✅ CSS 배경 이미지 다운로드 예약: ${filename}`);
    }
    
  } catch (error) {
    console.warn(`⚠️ 배경 이미지 처리 실패: ${imageUrl} - ${error.message}`);
  }
}

// 레이아웃 보존을 위한 메타 태그 추가
function addLayoutPreservationMeta(html) {
  const head = html.querySelector('head');
  if (!head) return;
  
  // 뷰포트 메타 태그가 없으면 추가
  if (!head.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    head.insertBefore(viewport, head.firstChild);
  }
  
  // 렌더링 모드 설정
  const xUaCompatible = document.createElement('meta');
  xUaCompatible.setAttribute('http-equiv', 'X-UA-Compatible');
  xUaCompatible.setAttribute('content', 'IE=edge');
  head.insertBefore(xUaCompatible, head.firstChild);
  
  console.log('🎨 레이아웃 보존 메타 태그 추가 완료');
}

// 레이아웃 안정화 CSS 추가 (최소화 버전 - 원본 레이아웃 보존)
function addLayoutStabilizationCSS(html) {
  const head = html.querySelector('head');
  if (!head) return;
  
  const stabilizationCSS = document.createElement('style');
  stabilizationCSS.setAttribute('data-wcs-stabilization', 'true');
  stabilizationCSS.textContent = `
    /* 최소한의 레이아웃 안정화 CSS - 원본 스타일 최대한 보존 */
    
    /* 기본 박스 모델만 설정 */
    * {
      box-sizing: border-box;
    }
    
    /* 이미지만 최대 너비 제한 */
    img {
      max-width: 100%;
      height: auto;
    }
    
    /* 숨겨진 접근성 요소는 그대로 숨김 유지 */
    .blind, .screen_out, .u_skip, .u_sr_only {
      /* 원본 스타일 그대로 유지 */
    }
  `;
  
  head.appendChild(stabilizationCSS);
  console.log('🎨 강화된 레이아웃 안정화 CSS 추가 완료');
}

// 기본 다운로드 폴더 경로 추정
async function getDefaultDownloadPath(filename) {
  try {
    // Windows 기본 다운로드 폴더 경로
    const userProfile = 'C:\\Users\\' + (window.navigator.userAgent.includes('Windows') ? 'User' : 'User');
    const downloadPath = `${userProfile}\\Downloads\\${filename}`;
    
    console.log('🔍 추정된 다운로드 경로:', downloadPath);
    return downloadPath;
    
  } catch (error) {
    console.log('기본 다운로드 경로 추정 실패:', error.message);
    return null;
  }
}