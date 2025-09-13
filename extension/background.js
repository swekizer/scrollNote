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
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
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
      let tabId = sender.tab && sender.tab.id;
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
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'showNoteInput',
              data: noteData
            }, function(response) {
              if (chrome.runtime.lastError) {
                console.error('Error sending message to content script (fallback):', chrome.runtime.lastError);
              } else {
                console.log('Message sent to content script (fallback):', response);
              }
            });
          } else {
            console.error('No active tab found to send showNoteInput');
          }
        });
      }
    });
    sendResponse({status: 'capturing'});
    return true;
  }
  
  if (request.action === 'saveToSupabase') {
    saveToBackend(request.data, sender);
    sendResponse({status: 'saving'});
  }
});

async function saveToBackend(data, sender) {
  let success = false;
  let errorMsg = '';
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
    if (response.ok) {
      console.log('Note saved successfully');
      success = true;
    } else {
      const errorText = await response.text();
      console.error('Failed to save note:', errorText);
      errorMsg = 'Failed to save note: ' + errorText;
    }
  } catch (error) {
    console.error('Error saving note:', error);
    errorMsg = error.message || 'Unknown error';
  }
  // Notify content script of result
  let tabId = sender.tab && sender.tab.id;
  const message = {
    action: 'noteSaveResult',
    success,
    error: errorMsg
  };
  if (tabId) {
    chrome.tabs.sendMessage(tabId, message);
  } else {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
}