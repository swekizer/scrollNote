importScripts('supabase-config.js');

async function uploadScreenshotToSupabase(base64Data, userEmail, userToken) {
  // Convert base64 to Blob
  function base64ToBlob(base64, type = 'image/png') {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

  const fileName = `snap_${Date.now()}_${Math.floor(Math.random()*10000)}.png`;
  const blob = base64ToBlob(base64Data);

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/screenshots/${userEmail}/${fileName}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${userToken}`
    },
    body: blob
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error('Failed to upload screenshot: ' + errorText);
  }

  // Construct public URL (assuming bucket is public)
  return `${SUPABASE_URL}/storage/v1/object/public/screenshots/${userEmail}/${fileName}`;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received:', request);
  
  if (request.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
      let snapData = request.data;
      if (chrome.runtime.lastError) {
        console.error('Screenshot error:', chrome.runtime.lastError?.message || chrome.runtime.lastError);
        // Still show note input, but indicate screenshot failed
        snapData.screenshot = null;
        snapData.screenshotError = true;
      } else {
        snapData.screenshot = dataUrl;
        snapData.screenshotError = false;
      }
      console.log('Sending showNoteInput to content script, screenshotError:', snapData.screenshotError);
      // Robustly send message to content script
      let tabId = sender.tab && sender.tab.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'showNoteInput',
          data: snapData
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
              data: snapData
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
    saveToSupabase(request.data, sender);
    sendResponse({status: 'saving'});
  }
});

async function saveToSupabase(data, sender) {
  let success = false;
  let errorMsg = '';
  try {
    const userStorage = await chrome.storage.local.get(['user']);
    if (!userStorage.user) throw new Error('User not authenticated');
    data.user_email = userStorage.user.email;

    // If screenshot is present, upload to Supabase Storage and use the URL
    if (data.screenshot) {
      try {
        const url = await uploadScreenshotToSupabase(data.screenshot, data.user_email, userStorage.user.token);
        data.screenshot = url;
      } catch (uploadErr) {
        console.error('Screenshot upload failed:', uploadErr);
        data.screenshot = null;
      }
    }

    // Remove screenshotError before saving to Supabase
    if ('screenshotError' in data) {
      delete data.screenshotError;
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/snaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${userStorage.user.token}`
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      console.log('Snap saved successfully');
      success = true;
    } else {
      const errorText = await response.text();
      console.error('Failed to save snap:', errorText);
      errorMsg = 'Failed to save snap: ' + errorText;
    }
  } catch (error) {
    console.error('Error saving snap:', error);
    errorMsg = error.message || 'Unknown error';
  }
  // Notify content script of result
  let tabId = sender.tab && sender.tab.id;
  const message = {
    action: 'snapSaveResult',
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