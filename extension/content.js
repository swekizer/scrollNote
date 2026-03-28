let shadowHost = null;
let shadowRoot = null;
let saveButton = null;

function getShadowRoot() {
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = 'scrollnote-host';
    shadowHost.style.position = 'absolute';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '100%';
    shadowHost.style.height = '100%';
    shadowHost.style.pointerEvents = 'none';
    shadowHost.style.zIndex = '2147483647';
    document.body.appendChild(shadowHost);
    
    shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
    
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      @import url("${chrome.runtime.getURL('styles.css')}");
      .scrollnote-wrapper { pointer-events: auto; }
    `;
    shadowRoot.appendChild(style);
  }
  return shadowRoot;
}

document.addEventListener('mouseup', function(e) {
  if (saveButton) {
    saveButton.remove();
    saveButton = null;
  }

  // Prevent showing the button if the click was inside our shadow dom
  const composedPath = e.composedPath();
  if (composedPath.some(el => el === shadowHost)) return;

  const selection = window.getSelection();
  if (selection.toString().trim()) {
    showSaveButton(e);
  }
});

function showSaveButton(e) {
  const root = getShadowRoot();
  saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.className = 'scrollnote-save-btn scrollnote-wrapper';
  saveButton.style.position = 'absolute';
  saveButton.style.left = e.pageX + 'px';
  saveButton.style.top = e.pageY + 'px';

  // Prevent mouseup on the button from bubbling up
  saveButton.addEventListener('mouseup', function(event) {
    event.stopPropagation();
  });
  
  // Prevent default to avoid losing text selection
  saveButton.addEventListener('mousedown', function(event) {
    event.preventDefault();
  });

  saveButton.onclick = function() {
    captureNote();
  };
  root.appendChild(saveButton);
}

function captureNote() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (!selectedText) {
    alert('No text selected');
    return;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const noteData = {
    text: selectedText,
    url: window.location.href,
    title: document.title,
    h1: document.querySelector('h1')?.textContent || '',
    position: {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY
    },
    timestamp: new Date().toISOString()
  };
  // Always show the note input immediately
  showNoteInput(noteData, true); // true = waiting for screenshot
  console.log('Sending captureScreenshot with explicit payload');
  chrome.runtime.sendMessage({
    action: 'captureScreenshot',
    data: noteData
  }, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    }
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'showNoteInput') {
    showNoteInput(request.data, false);
  }
  if (request.action === 'noteSaveResult') {
    handleNoteSaveResult(request.success, request.error, request.warning);
  }
  sendResponse({status: 'received'});
});

let currentNoteDiv = null;
let currentNoteData = null;

function showNoteInput(noteData, waitingForScreenshot = false) {
  const root = getShadowRoot();
  if (saveButton) {
    saveButton.remove();
    saveButton = null;
  }
  if (currentNoteDiv) {
    currentNoteData = { ...currentNoteData, ...noteData };
    const statusBanner = currentNoteDiv.querySelector('.scrollnote-capture-status');
    const saveBtn = currentNoteDiv.querySelector('#scrollnote-save-btn');
    if (statusBanner) {
      if (noteData.screenshotError) {
        statusBanner.textContent = 'Screenshot unavailable for this page.';
        statusBanner.style.color = '#ff6b6b';
      } else {
        statusBanner.textContent = 'Screenshot captured.';
        statusBanner.style.color = '#4ade80';
      }
    }
    // Re-enable save button once screenshot processing completes
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Note';
    }
    return;
  }

  currentNoteData = noteData;
  const noteDiv = document.createElement('div');
  currentNoteDiv = noteDiv;
  noteDiv.className = 'scrollnote-input scrollnote-wrapper';

  let captureStatusText = '';
  let captureStatusColor = '#888888';
  let isSavingDisabled = '';
  let saveBtnLabel = 'Save Note';

  if (noteData.screenshotError) {
    captureStatusText = 'Screenshot unavailable for this page.';
    captureStatusColor = '#ff6b6b';
  } else if (waitingForScreenshot) {
    captureStatusText = 'Attempting to capture screenshot...';
    isSavingDisabled = 'disabled';
    saveBtnLabel = 'Wait...';
  }

  noteDiv.innerHTML = `
    <div class="scrollnote-capture-status" style="color:${captureStatusColor}; margin-bottom:8px;">${captureStatusText}</div>
    <textarea placeholder="Add your note..."></textarea>
    <button id="scrollnote-save-btn" ${isSavingDisabled}>${saveBtnLabel}</button>
    <button id="scrollnote-cancel-btn">Cancel</button>
    <div id="scrollnote-status-msg" style="margin-top:8px;"></div>
  `;
  noteDiv.style.position = 'fixed';
  noteDiv.style.top = '50%';
  noteDiv.style.left = '50%';
  noteDiv.style.transform = 'translate(-50%, -50%)';
  root.appendChild(noteDiv);
  noteDiv.querySelector('#scrollnote-save-btn').onclick = function() {
    const note = noteDiv.querySelector('textarea').value;
    currentNoteData.note = note;
    this.disabled = true; // Disable the Save button immediately to prevent multiple submissions
    noteDiv.querySelector('#scrollnote-status-msg').textContent = 'Saving...';
    chrome.runtime.sendMessage({
      action: 'saveToSupabase',
      data: currentNoteData
    });
  };
  noteDiv.querySelector('#scrollnote-cancel-btn').onclick = function() {
    noteDiv.remove();
    currentNoteDiv = null;
    currentNoteData = null;
  };
}

function handleNoteSaveResult(success, error, warning) {
  if (!currentNoteDiv) return;
  const statusMsg = currentNoteDiv.querySelector('#scrollnote-status-msg');
  if (success) {
    statusMsg.textContent = warning || 'Note saved successfully!';
    statusMsg.style.color = '#4ade80';
    if (warning) {
      statusMsg.style.color = '#f59e0b';
    }
    const divToRemove = currentNoteDiv;
    currentNoteDiv = null;
    currentNoteData = null;
    setTimeout(() => {
      divToRemove.remove();
    }, 800);
  } else {
    statusMsg.textContent = 'Failed to save note: ' + (error || 'Unknown error');
    statusMsg.style.color = '#ff6b6b';
  }
}