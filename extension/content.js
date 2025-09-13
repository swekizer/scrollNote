let saveButton = null;

document.addEventListener('mouseup', function(e) {
  if (saveButton) saveButton.remove();

  // Prevent showing the button if the click was on the save button itself
  if (e.target.className === 'scrollnote-save-btn') return;

  const selection = window.getSelection();
  if (selection.toString().trim()) {
    showSaveButton(e);
  }
});

function showSaveButton(e) {
  saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.className = 'scrollnote-save-btn';
  saveButton.style.position = 'absolute';
  saveButton.style.left = e.pageX + 'px';
  saveButton.style.top = e.pageY + 'px';
  saveButton.style.zIndex = '9999';

  // Prevent mouseup on the button from bubbling up
  saveButton.addEventListener('mouseup', function(event) {
    event.stopPropagation();
  });

  saveButton.onclick = function() {
    captureNote();
  };
  document.body.appendChild(saveButton);
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
    handleNoteSaveResult(request.success, request.error);
  }
  sendResponse({status: 'received'});
});

let currentNoteDiv = null;

function showNoteInput(noteData, waitingForScreenshot = false) {
  if (saveButton) saveButton.remove();
  if (currentNoteDiv) currentNoteDiv.remove();
  const noteDiv = document.createElement('div');
  currentNoteDiv = noteDiv;
  noteDiv.className = 'scrollnote-input';
  let warning = '';
  if (noteData.screenshotError) {
    warning = '<div style="color:#ff6b6b; margin-bottom:8px;">Screenshot unavailable for this page.</div>';
  } else if (waitingForScreenshot) {
    warning = '<div style="color:#888888; margin-bottom:8px;">Attempting to capture screenshot...</div>';
  }
  noteDiv.innerHTML = `
    ${warning}
    <textarea placeholder="Add your note..."></textarea>
    <button id="scrollnote-save-btn">Save Note</button>
    <button id="scrollnote-cancel-btn">Cancel</button>
    <div id="scrollnote-status-msg" style="margin-top:8px;"></div>
  `;
  noteDiv.style.position = 'fixed';
  noteDiv.style.top = '50%';
  noteDiv.style.left = '50%';
  noteDiv.style.transform = 'translate(-50%, -50%)';
  noteDiv.style.zIndex = '10000';
  document.body.appendChild(noteDiv);
  noteDiv.querySelector('#scrollnote-save-btn').onclick = function() {
    const note = noteDiv.querySelector('textarea').value;
    noteData.note = note;
    this.disabled = true; // Disable the Save button immediately to prevent multiple submissions
    noteDiv.querySelector('#scrollnote-status-msg').textContent = 'Saving...';
    chrome.runtime.sendMessage({
      action: 'saveToSupabase',
      data: noteData
    });
  };
  noteDiv.querySelector('#scrollnote-cancel-btn').onclick = function() {
    noteDiv.remove();
    currentNoteDiv = null;
  };
}

function handleNoteSaveResult(success, error) {
  if (!currentNoteDiv) return;
  const statusMsg = currentNoteDiv.querySelector('#scrollnote-status-msg');
  if (success) {
    statusMsg.textContent = 'Note saved successfully!';
    statusMsg.style.color = '#4ade80';
    setTimeout(() => {
      if (currentNoteDiv) currentNoteDiv.remove();
      currentNoteDiv = null;
    }, 1200);
  } else {
    statusMsg.textContent = 'Failed to save note: ' + (error || 'Unknown error');
    statusMsg.style.color = '#ff6b6b';
  }
}