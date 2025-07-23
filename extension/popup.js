document.getElementById('signIn').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      chrome.storage.local.set({
        user: { email, token: data.access_token }
      });
      showUserSection(email);
    }
  } catch (error) {
    console.error('Sign in error:', error);
  }
};

document.getElementById('signUp').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.access_token || data.user) {
      alert('Sign up successful! Please sign in.');
    }
  } catch (error) {
    console.error('Sign up error:', error);
  }
};

document.getElementById('viewSnaps').onclick = function() {
  chrome.tabs.create({url: 'http://localhost:3000/website/index.html'});
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