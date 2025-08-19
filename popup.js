document.addEventListener('DOMContentLoaded', async function() {
  const saveFullPageBtn = document.getElementById('saveFullPage');
  const toggleSelectModeBtn = document.getElementById('toggleSelectMode');
  const saveSelectionBtn = document.getElementById('saveSelection');
  const clearSelectionBtn = document.getElementById('clearSelection');
  const statusDiv = document.getElementById('status');
  
  let selectModeActive = false;
  
  // 페이지 로드 시 현재 선택 모드 상태 확인
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await ensureContentScriptLoaded(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectMode' });
    if (response && response.success) {
      selectModeActive = response.active;
      updateSelectModeButton();
    }
  } catch (error) {
    console.log('선택 모드 상태 확인 실패:', error.message);
  }

  function showStatus(message, isError = false, duration = 3000) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? 'error' : 'success'}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, duration);
  }

  function disableButtons() {
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(btn => btn.disabled = true);
  }

  function enableButtons() {
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(btn => btn.disabled = false);
  }

  // 선택 모드 버튼 상태 업데이트
  function updateSelectModeButton() {
    if (selectModeActive) {
      toggleSelectModeBtn.textContent = '선택 모드 종료';
      toggleSelectModeBtn.style.backgroundColor = '#ff9800';
    } else {
      toggleSelectModeBtn.textContent = '영역 선택 모드';
      toggleSelectModeBtn.style.backgroundColor = '#2196F3';
    }
  }

  // Content script 로드 확인 및 주입 함수
  async function ensureContentScriptLoaded(tabId) {
    try {
      // 먼저 ping을 보내서 content script가 응답하는지 확인
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (error) {
      // content script가 없으면 주입
      console.log('Content script 주입 중...');
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        // 주입 후 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (injectionError) {
        console.error('Content script 주입 실패:', injectionError);
        throw new Error('스크립트를 페이지에 로드할 수 없습니다. 페이지를 새로고침하고 다시 시도하세요.');
      }
    }
  }

  // 전체 페이지 저장
  saveFullPageBtn.addEventListener('click', async () => {
    disableButtons();
    showStatus('전체 페이지를 저장 중입니다...', false, 10000);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await ensureContentScriptLoaded(tab.id);
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'saveFullPage' });
      
      if (response && !response.success) {
        showStatus(`저장 실패: ${response.error}`, true);
      } else {
        showStatus('✅ 전체 페이지가 다운로드 폴더에 저장되었습니다!', false, 5000);
      }
    } catch (error) {
      console.warn('저장 처리:', error.message);
      showStatus('⚠️ 저장을 시도했습니다. 다운로드 폴더를 확인하세요.', false, 5000);
    } finally {
      enableButtons();
    }
  });

  // 선택 모드 토글
  toggleSelectModeBtn.addEventListener('click', async () => {
    disableButtons();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 먼저 content script가 로드되었는지 확인하고 필요시 주입
      await ensureContentScriptLoaded(tab.id);
      
      selectModeActive = !selectModeActive;
      
      console.log('선택 모드 전환 시도:', selectModeActive);
      
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleSelectMode', 
        active: selectModeActive 
      });
      
      console.log('선택 모드 응답:', response);
      
      if (response && response.success) {
        updateSelectModeButton();
        if (selectModeActive) {
          showStatus('✅ 영역 선택 모드가 활성화되었습니다. 웹페이지에서 영역을 클릭하세요!', false, 5000);
        } else {
          showStatus('✅ 선택 모드가 종료되었습니다.');
        }
      } else {
        // 실패시 상태 되돌리기
        selectModeActive = !selectModeActive;
        showStatus(`❌ 선택 모드 전환 실패: ${response?.error || '알 수 없는 오류'}`, true);
      }
    } catch (error) {
      // 실패시 상태 되돌리기
      selectModeActive = !selectModeActive;
      console.error('선택 모드 전환 오류:', error);
      showStatus(`❌ 선택 모드 전환 실패: ${error.message}`, true);
    } finally {
      enableButtons();
    }
  });

  // 선택된 영역 저장
  saveSelectionBtn.addEventListener('click', async () => {
    disableButtons();
    showStatus('선택된 영역을 저장 중입니다...', false, 10000);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await ensureContentScriptLoaded(tab.id);
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'saveSelection' });
      
      if (response && !response.success) {
        showStatus(`저장 실패: ${response.error}`, true);
      } else {
        showStatus('✅ 선택된 영역이 다운로드 폴더에 저장되었습니다!', false, 5000);
      }
    } catch (error) {
      console.warn('선택 영역 저장:', error.message);
      showStatus('⚠️ 선택된 영역이 없거나 저장을 시도했습니다. 다운로드 폴더를 확인하세요.', false, 5000);
    } finally {
      enableButtons();
    }
  });

  // 선택 초기화
  clearSelectionBtn.addEventListener('click', async () => {
    disableButtons();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await ensureContentScriptLoaded(tab.id);
      await chrome.tabs.sendMessage(tab.id, { action: 'clearSelection' });
      showStatus('선택이 초기화되었습니다.');
    } catch (error) {
      showStatus('초기화 실패', true);
    } finally {
      enableButtons();
    }
  });
});