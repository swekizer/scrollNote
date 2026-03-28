importScripts('api-config.js');

async function uploadScreenshotToBackend(base64Data, userEmail, userToken) {
  const fileName = `note_${Date.now()}_${Math.floor(Math.random()*10000)}.png`;
  
  const uploadRes = await fetch(`${API_URL}/api/storage/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      fileData: base64Data,
      fileName: fileName,
      userEmail: userEmail
    })
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error('Failed to upload screenshot: ' + errorText);
  }

  const result = await uploadRes.json();
  return result.fileUrl;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received:', request);
  
  if (request.action === 'captureScreenshot') {
    const windowId = sender.tab?.windowId;
    chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 80 }, function(dataUrl) {
      let noteData = request.data;
      if (chrome.runtime.lastError) {
        console.error('Screenshot error:', chrome.runtime.lastError?.message || chrome.runtime.lastError);
        // Still show note input, but indicate screenshot failed
        noteData.screenshot = null;
        noteData.screenshotError = true;
      } else {
        noteData.screenshot = dataUrl;
        noteData.screenshotError = false;
      }
      console.log('Sending showNoteInput to content script, screenshotError:', noteData.screenshotError);
      // Robustly send message to content script
      let tabId = request.tabId || (sender.tab && sender.tab.id);
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'showNoteInput',
          data: noteData
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to content script:', chrome.runtime.lastError);
          } else {
            console.log('Message sent to content script:', response);
          }
        });
      } else {
        console.error('No valid tab ID found to send showNoteInput');
      }
    });
    sendResponse({status: 'capturing'});
    return true;
  }
  
  if (request.action === 'saveToSupabase') {
    saveToBackend(request.data, sender, request.tabId);
    sendResponse({status: 'saving'});
  }
});

async function saveToBackend(data, sender, explicitTabId) {
  let success = false;
  let errorMsg = '';
  let warningMsg = '';
  try {
    const userStorage = await chrome.storage.local.get(['user']);
    if (!userStorage.user) throw new Error('User not authenticated');
    data.user_email = userStorage.user.email;

    // If screenshot is present, upload to backend and use the URL
    if (data.screenshot) {
      try {
        const url = await uploadScreenshotToBackend(data.screenshot, data.user_email, userStorage.user.token);
        data.screenshot = url;
      } catch (uploadErr) {
        console.error('Screenshot upload failed:', uploadErr);
        warningMsg = 'Screenshot upload failed. The note was saved without screenshot.';
        data.screenshot = null;
      }
    }

    // Remove screenshotError before saving to backend
    if ('screenshotError' in data) {
      delete data.screenshotError;
    }

    const response = await fetch(`${API_URL}/api/snaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStorage.user.token}`
      },
      body: JSON.stringify(data)
    });

    if (response.status === 401) {
       chrome.storage.local.remove(['user']);
       throw new Error('Session expired. Please click the scrollNote icon and sign in again.');
    }

    if (response.ok) {
      console.log('Note saved successfully');
      success = true;
    } else {
      let errorText = '';
      try {
        const errorBody = await response.json();
        errorText = errorBody.message || JSON.stringify(errorBody);
      } catch (_unused) {
        errorText = await response.text();
      }
      console.error('Failed to save note:', errorText);
      errorMsg = 'Failed to save note: ' + errorText;
    }
  } catch (error) {
    console.error('Error saving note:', error);
    errorMsg = error.message || 'Unknown error';
  }
  // Notify content script of result
  let tabId = explicitTabId || (sender.tab && sender.tab.id);
  const message = {
    action: 'noteSaveResult',
    success,
    error: errorMsg,
    warning: warningMsg
  };
  if (tabId) {
    chrome.tabs.sendMessage(tabId, message);
  } else {
    console.error('No valid tab ID found to send save result');
  }
}