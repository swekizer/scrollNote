document.getElementById('signIn').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) return;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.user && data.user.token) {
      chrome.storage.local.set({
        user: data.user
      });
      showUserSection(email);
    } else if (data.message) {
      alert(`Sign in failed: ${data.message}`);
    }
  } catch (error) {
    console.error('Sign in error:', error);
    alert('An error occurred during sign in');
  }
};

document.getElementById('signUp').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) return;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Sign up successful! Please sign in.');
    } else if (data.message) {
      alert(`Sign up failed: ${data.message}`);
    } else {
      alert('Sign up failed. Please try again.');
    }
  } catch (error) {
    console.error('Sign up error:', error);
    alert('An error occurred during sign up');
  }
};

document.getElementById('viewNotes').onclick = function() {
  // Using the deployed website URL for production
  chrome.tabs.create({url: 'https://scrollnote-home.onrender.com'});
};

document.getElementById('signOut').onclick = function() {
  chrome.storage.local.remove(['user']);
  document.getElementById('authForm').style.display = 'block';
  document.getElementById('userSection').style.display = 'none';
};

function showUserSection(email) {
  document.getElementById('userEmail').textContent = email;
  document.getElementById('authForm').style.display = 'none';
  document.getElementById('userSection').style.display = 'block';
}

chrome.storage.local.get(['user'], function(result) {
  if (result.user) {
    showUserSection(result.user.email);
  }
});