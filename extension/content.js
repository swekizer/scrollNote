let shadowHost = null;
let shadowRoot = null;
let saveButton = null;

// Map to store active note sessions by ID to prevent race conditions
const activeSessions = new Map();

function getShadowRoot() {
  if (!shadowHost) {
    shadowHost = document.createElement("div");
    shadowHost.id = "scrollnote-host";
    shadowHost.style.position = "absolute";
    shadowHost.style.top = "0";
    shadowHost.style.left = "0";
    shadowHost.style.width = "100%";
    shadowHost.style.height = "100%";
    shadowHost.style.pointerEvents = "none";
    shadowHost.style.zIndex = "2147483647";
    document.body.appendChild(shadowHost);

    shadowRoot = shadowHost.attachShadow({ mode: "closed" });

    // Inject styles
    const style = document.createElement("style");
    style.textContent = `
      @import url("${chrome.runtime.getURL("styles.css")}");
      .scrollnote-wrapper { pointer-events: auto; }
    `;
    shadowRoot.appendChild(style);
  }
  return shadowRoot;
}

document.addEventListener("mouseup", function (e) {
  if (saveButton) {
    saveButton.remove();
    saveButton = null;
  }

  // Prevent showing the button if the click was inside our shadow dom
  const composedPath = e.composedPath();
  if (composedPath.some((el) => el === shadowHost)) return;

  const selection = window.getSelection();
  if (selection.toString().trim()) {
    showSaveButton(e);
  }
});

function showSaveButton(e) {
  const root = getShadowRoot();
  saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.className = "scrollnote-save-btn scrollnote-wrapper";
  saveButton.style.position = "absolute";
  saveButton.style.left = e.pageX + "px";
  saveButton.style.top = e.pageY + "px";

  // Prevent mouseup on the button from bubbling up
  saveButton.addEventListener("mouseup", function (event) {
    event.stopPropagation();
  });

  // Prevent default to avoid losing text selection
  saveButton.addEventListener("mousedown", function (event) {
    event.preventDefault();
  });

  saveButton.onclick = function () {
    captureNote();
  };
  root.appendChild(saveButton);
}

function captureNote() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  if (!selectedText) {
    alert("No text selected");
    return;
  }

  // Create a unique session ID for this capture
  const sessionId =
    Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const noteData = {
    text: selectedText,
    url: window.location.href,
    title: document.title,
    h1: document.querySelector("h1")?.textContent || "",
    position: {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    },
    timestamp: new Date().toISOString(),
  };

  // Store session data
  activeSessions.set(sessionId, {
    data: noteData,
    div: null,
    isSaving: false,
  });

  // Always show the note input immediately
  showNoteInput(sessionId, noteData, true); // true = waiting for screenshot

  // Remove save button after capture starts
  if (saveButton) {
    saveButton.remove();
    saveButton = null;
  }

  console.log(
    "Sending captureScreenshot with explicit payload, sessionId:",
    sessionId,
  );
  chrome.runtime.sendMessage(
    {
      action: "captureScreenshot",
      data: noteData,
      sessionId: sessionId,
    },
    function (response) {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
      }
    },
  );
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "showNoteInput") {
    showNoteInput(request.sessionId, request.data, false);
  }
  if (request.action === "noteSaveResult") {
    handleNoteSaveResult(
      request.sessionId,
      request.success,
      request.error,
      request.warning,
    );
  }
  sendResponse({ status: "received" });
});

function showNoteInput(sessionId, noteData, waitingForScreenshot = false) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const root = getShadowRoot();

  // If dialog already exists for this session, just update it
  if (session.div) {
    const statusBanner = session.div.querySelector(
      ".scrollnote-capture-status",
    );
    const saveBtn = session.div.querySelector("#scrollnote-save-btn");
    if (statusBanner) {
      if (noteData.screenshotError) {
        statusBanner.textContent = "Screenshot failed";
        statusBanner.style.color = "#ff6b6b";
      } else {
        statusBanner.textContent = "Screenshot ready";
        statusBanner.style.color = "#4ade80";
      }
    }
    // Re-enable save button once screenshot processing completes
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Note";
    }
    return;
  }

  session.data = { ...session.data, ...noteData };

  const noteDiv = document.createElement("div");
  session.div = noteDiv;
  noteDiv.className = "scrollnote-input scrollnote-wrapper";
  noteDiv.dataset.sessionId = sessionId;

  let captureStatusText = "";
  let captureStatusColor = "#888888";
  let isSavingDisabled = "";
  let saveBtnLabel = "Save Note";

  if (noteData.screenshotError) {
    captureStatusText = "Screenshot failed";
    captureStatusColor = "#ff6b6b";
  } else if (waitingForScreenshot) {
    captureStatusText = "Capturing screenshot...";
    isSavingDisabled = "disabled";
    saveBtnLabel = "Wait...";
  } else {
    captureStatusText = "Screenshot ready";
    captureStatusColor = "#4ade80";
  }

  const snippet = session.data.text.length > 100 
    ? session.data.text.substring(0, 100) + '...' 
    : session.data.text;

  noteDiv.innerHTML = `
    <div class="scrollnote-header">
      <div class="scrollnote-title">Save Note</div>
      <div class="scrollnote-capture-status" style="color:${captureStatusColor};">${captureStatusText}</div>
    </div>
    <div class="scrollnote-selected-text-preview">${snippet}</div>
    <textarea placeholder="Add an optional comment..."></textarea>
    <div class="scrollnote-actions">
      <button id="scrollnote-cancel-btn">Cancel</button>
      <button id="scrollnote-save-btn" class="scrollnote-primary-btn" ${isSavingDisabled}>${saveBtnLabel}</button>
    </div>
    <div id="scrollnote-status-msg"></div>
  `;
  noteDiv.style.position = "fixed";
  noteDiv.style.top = "24px";
  noteDiv.style.right = "24px";
  noteDiv.style.zIndex = "2147483647";
  root.appendChild(noteDiv);

  noteDiv.querySelector("#scrollnote-save-btn").onclick = function () {
    if (session.isSaving) return;
    session.isSaving = true;

    const note = noteDiv.querySelector("textarea").value;
    session.data.note = note;
    this.classList.add("scrollnote-btn-loading");
    this.disabled = true;
    noteDiv.querySelector("#scrollnote-status-msg").textContent = "Saving...";

    // Disable cancel button during save
    const cancelBtn = noteDiv.querySelector("#scrollnote-cancel-btn");
    if (cancelBtn) {
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = "0.5";
      cancelBtn.style.cursor = "not-allowed";
    }

    chrome.runtime.sendMessage({
      action: "saveToSupabase",
      data: session.data,
      sessionId: sessionId,
    });
  };

  noteDiv.querySelector("#scrollnote-cancel-btn").onclick = function () {
    closeSession(sessionId);
  };
}

function handleNoteSaveResult(sessionId, success, error, warning) {
  const session = activeSessions.get(sessionId);
  if (!session || !session.div) return;

  const statusMsg = session.div.querySelector("#scrollnote-status-msg");
  const saveBtn = session.div.querySelector("#scrollnote-save-btn");
  const cancelBtn = session.div.querySelector("#scrollnote-cancel-btn");

  // Restore button states
  if (saveBtn) {
    saveBtn.classList.remove("scrollnote-btn-loading");
    saveBtn.disabled = false;
  }
  if (cancelBtn) {
    cancelBtn.disabled = false;
    cancelBtn.style.opacity = "1";
    cancelBtn.style.cursor = "pointer";
  }

  if (success) {
    statusMsg.textContent = warning || "Note saved successfully!";
    statusMsg.style.color = warning ? "#f59e0b" : "#4ade80";
    const divToRemove = session.div;
    closeSession(sessionId);
    setTimeout(() => {
      if (divToRemove.parentNode) {
        divToRemove.remove();
      }
    }, 800);
  } else {
    session.isSaving = false;
    statusMsg.textContent =
      "Failed to save note: " + (error || "Unknown error");
    statusMsg.style.color = "#ff6b6b";
    if (saveBtn) {
      saveBtn.textContent = "Save Note";
    }
  }
}

function closeSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    activeSessions.delete(sessionId);
  }
}
