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
  addSelectionStyles();
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick, true);
  
  // 모든 div, section, article 등에 selectable 클래스 추가
  document.querySelectorAll('div, section, article, main, aside, header, footer, nav').forEach(el => {
    el.classList.add('wcs-selectable');
  });
  
  console.log('✅ Web Content Saver: 선택 모드 활성화');
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
        try {
          saveFullPage();
          sendResponse({ success: true });
        } catch (error) {
          console.error('Web Content Saver: 전체 페이지 저장 실패 -', error.message);
          sendResponse({ success: false, error: error.message });
        }
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
        try {
          saveSelection();
          sendResponse({ success: true });
        } catch (error) {
          console.error('Web Content Saver: 선택 영역 저장 실패 -', error.message);
          sendResponse({ success: false, error: error.message });
        }
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
function saveFullPage() {
  try {
    const title = document.title || 'webpage';
    const content = createFullHTML();
    downloadContent(content, `${sanitizeFilename(title)}_full.html`);
    console.log('✅ Web Content Saver: 전체 페이지 저장 완료');
  } catch (error) {
    console.error('Web Content Saver: 전체 페이지 저장 실패:', error);
    throw error;
  }
}

function saveSelection() {
  try {
    if (selectedElements.size === 0) {
      throw new Error('선택된 요소가 없습니다.');
    }
    
    const title = document.title || 'webpage';
    const content = createSelectionHTML();
    downloadContent(content, `${sanitizeFilename(title)}_selection.html`);
    console.log(`✅ Web Content Saver: ${selectedElements.size}개 요소 저장 완료`);
    
  } catch (error) {
    console.error('Web Content Saver: 선택 영역 저장 실패:', error);
    throw error;
  }
}

function createFullHTML() {
  const html = document.documentElement.cloneNode(true);
  
  // 스타일시트 인라인으로 포함
  const styleSheets = Array.from(document.styleSheets);
  const inlineStyles = document.createElement('style');
  
  let allCSS = '';
  styleSheets.forEach(sheet => {
    try {
      if (sheet.cssRules) {
        Array.from(sheet.cssRules).forEach(rule => {
          allCSS += rule.cssText + '\n';
        });
      }
    } catch (e) {
      if (sheet.href) {
        const linkTag = document.createElement('link');
        linkTag.rel = 'stylesheet';
        linkTag.href = sheet.href;
        html.querySelector('head').appendChild(linkTag);
      }
    }
  });
  
  if (allCSS) {
    inlineStyles.textContent = allCSS;
    html.querySelector('head').appendChild(inlineStyles);
  }
  
  // 선택 관련 클래스 제거
  html.querySelectorAll('.wcs-hover, .wcs-selected, .wcs-selectable').forEach(el => {
    el.classList.remove('wcs-hover', 'wcs-selected', 'wcs-selectable');
  });
  
  // 선택 모드 스타일 제거
  const selectionStyle = html.querySelector('#web-content-saver-styles');
  if (selectionStyle) selectionStyle.remove();
  
  processExternalResources(html);
  
  return html.outerHTML;
}

function createSelectionHTML() {
  // 선택된 요소들을 포함할 HTML 생성
  const selectedHTML = Array.from(selectedElements).map(element => {
    const cloned = element.cloneNode(true);
    // 선택 관련 클래스 제거
    cloned.classList.remove('wcs-hover', 'wcs-selected', 'wcs-selectable');
    return cloned.outerHTML;
  }).join('\n\n');
  
  // 현재 페이지의 스타일 수집
  let allCSS = '';
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      if (sheet.cssRules) {
        Array.from(sheet.cssRules).forEach(rule => {
          allCSS += rule.cssText + '\n';
        });
      }
    } catch (e) {
      // CORS 제한 무시
    }
  });
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Selected Content - ${document.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      margin: 20px;
      padding: 20px;
    }
    .source-info {
      background: #f5f5f5;
      padding: 10px;
      margin-bottom: 20px;
      border-left: 4px solid #2196F3;
      font-size: 12px;
    }
    .selected-content {
      border: 1px solid #ddd;
      padding: 20px;
      margin-bottom: 20px;
      background: white;
    }
    ${allCSS}
  </style>
</head>
<body>
  <div class="source-info">
    <strong>출처:</strong> ${window.location.href}<br>
    <strong>저장 일시:</strong> ${new Date().toLocaleString()}<br>
    <strong>선택된 요소 수:</strong> ${selectedElements.size}개
  </div>
  ${selectedHTML}
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
    // Chrome Downloads API를 통한 다운로드
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // background script로 다운로드 요청
    chrome.runtime.sendMessage({
      action: 'downloadFile',
      url: url,
      filename: filename
    }, (response) => {
      URL.revokeObjectURL(url);
      if (response && response.success) {
        console.log('✅ Web Content Saver: 다운로드 완료 -', filename);
      } else {
        console.error('❌ Web Content Saver: 다운로드 실패');
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
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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