document.getElementById("signIn").onclick = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) return;

  try {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.user && data.user.token) {
      chrome.storage.local.set({
        user: data.user,
      });
      showUserSection(email);
    } else if (data.message) {
      alert(`Sign in failed: ${data.message}`);
    } else {
      alert("Sign in failed. Please check your credentials and try again.");
    }
  } catch (error) {
    console.error("Sign in error:", error);
    alert(`An error occurred during sign in: ${error.message || "Unknown error"}`);
  }
};

async function refreshUserToken() {
  const result = await chrome.storage.local.get(["user"]);
  const user = result.user;
  if (!user || !user.refresh_token) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: user.refresh_token }),
    });
    const data = await response.json();
    if (response.ok && data.user) {
      const updatedUser = { ...user, ...data.user };
      chrome.storage.local.set({ user: updatedUser });
      return true;
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
  }
  return false;
}

document.getElementById("signUp").onclick = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) return;

  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      alert("Sign up successful! Please sign in.");
    } else if (data.message) {
      alert(`Sign up failed: ${data.message}`);
    } else {
      alert("Sign up failed. Please try again.");
    }
  } catch (error) {
    console.error("Sign up error:", error);
    alert("An error occurred during sign up");
  }
};

document.getElementById("viewNotes").onclick = function () {
  chrome.tabs.create({ url: WEBSITE_URL });
};

document.getElementById("signOut").onclick = function () {
  if (!confirm("Are you sure you want to sign out?")) return;
  chrome.storage.local.remove(["user"]);
  document.getElementById("authForm").style.display = "block";
  document.getElementById("userSection").style.display = "none";
};

function showUserSection(email) {
  document.getElementById("userEmail").textContent = email;
  document.getElementById("authForm").style.display = "none";
  document.getElementById("userSection").style.display = "block";
}

// Wait for config to load before initializing UI
window.SCROLLNOTE_CONFIG_READY.then(async () => {
  const showSettings = window.SCROLLNOTE_SHOW_SETTINGS === true;
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsSection = document.getElementById("settingsSection");

  if (!showSettings) {
    if (settingsToggle) settingsToggle.style.display = "none";
    if (settingsSection) settingsSection.style.display = "none";
  }

  // Initialize settings inputs with current/custom values
  const custom = await window.scrollNoteSettings.getCustom();
  const apiUrlInput = document.getElementById("apiUrlInput");
  const websiteUrlInput = document.getElementById("websiteUrlInput");
  if (apiUrlInput) apiUrlInput.value = custom.customApiUrl || "";
  if (websiteUrlInput) websiteUrlInput.value = custom.customWebsiteUrl || "";

  // Settings toggle
  if (showSettings && settingsToggle) {
    settingsToggle.onclick = function () {
      settingsSection.classList.toggle("visible");
    };
  }

  // Save settings
  if (showSettings) {
    document.getElementById("saveSettings").onclick = async function () {
      const apiUrl = document.getElementById("apiUrlInput").value.trim();
      const websiteUrl = document.getElementById("websiteUrlInput").value.trim();
      await window.scrollNoteSettings.setApiUrl(apiUrl || null);
      await window.scrollNoteSettings.setWebsiteUrl(websiteUrl || null);
      alert("Settings saved! The extension will use these URLs now.");
    };
  }

  // Reset settings
  if (showSettings) {
    document.getElementById("resetSettings").onclick = async function () {
      await window.scrollNoteSettings.reset();
      document.getElementById("apiUrlInput").value = "";
      document.getElementById("websiteUrlInput").value = "";
      alert("Settings reset to defaults.");
    };
  }

  // Check user auth
  chrome.storage.local.get(["user"], async function (result) {
    if (result.user) {
      // Proactively refresh token when popup opens to avoid 401s
      const refreshed = await refreshUserToken();
      const finalUser = refreshed
        ? (await chrome.storage.local.get(["user"])).user
        : result.user;
      showUserSection(finalUser.email);
    }
  });
});
