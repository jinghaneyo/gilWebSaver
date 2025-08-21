// Background script - 다운로드 처리 및 사이드 패널 설정
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadFile') {
    downloadFile(request.url, request.filename, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  } else if (request.action === 'convertToPdf') {
    convertToPdf(request.data, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
});

// 확장 프로그램 설치 시 사이드 패널 설정
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

async function downloadFile(url, filename, sendResponse) {
  try {
    console.log('Web Content Saver: 다운로드 시작 -', filename);
    
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false, // 자동으로 다운로드 폴더에 저장
      conflictAction: 'uniquify' // 같은 이름 파일이 있으면 번호 추가
    });
    
    console.log('✅ Web Content Saver: 다운로드 완료 - ID:', downloadId);
    
    // 다운로드 완료를 기다리고 파일 경로 가져오기
    const downloadInfo = await waitForDownloadComplete(downloadId);
    
    sendResponse({ 
      success: true, 
      downloadId: downloadId,
      filePath: downloadInfo.filename // 실제 다운로드된 파일의 절대 경로
    });
    
  } catch (error) {
    console.error('❌ Web Content Saver: 다운로드 실패:', error.message);
    sendResponse({ success: false, error: error.message });
  }
}

// 다운로드 완료를 기다리는 함수
function waitForDownloadComplete(downloadId) {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(async () => {
      try {
        const downloads = await chrome.downloads.search({ id: downloadId });
        if (downloads.length > 0) {
          const download = downloads[0];
          
          if (download.state === 'complete') {
            clearInterval(checkInterval);
            resolve(download);
          } else if (download.state === 'interrupted') {
            clearInterval(checkInterval);
            reject(new Error('다운로드가 중단되었습니다: ' + download.error));
          }
        }
      } catch (error) {
        clearInterval(checkInterval);
        reject(error);
      }
    }, 100); // 100ms마다 확인
    
    // 10초 타임아웃
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('다운로드 타임아웃'));
    }, 10000);
  });
}

// PDF 변환 API 호출 함수
async function convertToPdf(requestData, sendResponse) {
  try {
    console.log('🔍 Background: PDF 변환 요청 처리 시작');
    console.log('🔍 Background: 요청 데이터:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch('http://localhost:5000/convert-to-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('🔍 Background: 서버 응답 상태:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Background: PDF 변환 성공:', result);
      sendResponse({ success: true, result: result });
    } else {
      const error = await response.text();
      console.error('❌ Background: PDF 변환 실패:', error);
      sendResponse({ success: false, error: `HTTP ${response.status}: ${error}` });
    }
    
  } catch (error) {
    console.error('❌ Background: PDF 변환 중 오류:', error.message);
    sendResponse({ success: false, error: error.message });
  }
}

console.log('✅ Web Content Saver background script loaded');