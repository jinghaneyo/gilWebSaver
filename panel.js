let selectMode = false;

document.getElementById('closePanel').addEventListener('click', () => {
  window.close();
});

document.getElementById('saveFullPage').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    chrome.tabs.sendMessage(tab.id, { action: 'saveFullPage' });
    showStatus('전체 페이지를 저장 중입니다...', 'success');
  } catch (error) {
    showStatus('저장 중 오류가 발생했습니다.', 'error');
  }
});

document.getElementById('toggleSelectMode').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  selectMode = !selectMode;
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggleSelectMode',
      enabled: selectMode
    });
    
    const button = document.getElementById('toggleSelectMode');
    button.textContent = selectMode ? '선택 모드 종료' : '영역 선택 모드';
    button.style.backgroundColor = selectMode ? '#ff9800' : '#2196F3';
    
    showStatus(selectMode ? '영역 선택 모드가 활성화되었습니다.' : '선택 모드가 종료되었습니다.', 'success');
  } catch (error) {
    showStatus('모드 전환 중 오류가 발생했습니다.', 'error');
  }
});

document.getElementById('saveSelection').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    chrome.tabs.sendMessage(tab.id, { action: 'saveSelection' });
    showStatus('선택된 영역을 저장 중입니다...', 'success');
  } catch (error) {
    showStatus('저장 중 오류가 발생했습니다.', 'error');
  }
});

document.getElementById('clearSelection').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    chrome.tabs.sendMessage(tab.id, { action: 'clearSelection' });
    showStatus('선택이 초기화되었습니다.', 'success');
  } catch (error) {
    showStatus('초기화 중 오류가 발생했습니다.', 'error');
  }
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}