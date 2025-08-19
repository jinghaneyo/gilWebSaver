// Background script - 다운로드 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadFile') {
    downloadFile(request.url, request.filename, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
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
    sendResponse({ success: true, downloadId: downloadId });
    
  } catch (error) {
    console.error('❌ Web Content Saver: 다운로드 실패:', error.message);
    sendResponse({ success: false, error: error.message });
  }
}

console.log('✅ Web Content Saver background script loaded');