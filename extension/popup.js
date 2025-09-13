document.getElementById('signIn').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) return;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user && data.session) {
      const userData = {
        email: data.user.email,
        id: data.user.id,
        token: data.session.access_token
      };
      
      chrome.storage.local.set({
        user: userData
      });
      showUserSection(email);
    }
  } catch (error) {
    console.error('Sign in error:', error);
    alert(`Sign in failed: ${error.message || 'An error occurred'}`);
  }
};

document.getElementById('signUp').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) return;
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user) {
      alert('Sign up successful! Please check your email for confirmation and then sign in.');
    } else {
      alert('Sign up failed. Please try again.');
    }
  } catch (error) {
    console.error('Sign up error:', error);
    alert(`Sign up failed: ${error.message || 'An error occurred'}`);
  }
};

document.getElementById('viewSnaps').onclick = function() {
  // Using the deployed website URL for production
  chrome.tabs.create({url: 'https://scrollnote-home.onrender.com'});
};

document.getElementById('signOut').onclick = async function() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    chrome.storage.local.remove(['user']);
    document.getElementById('authForm').style.display = 'block';
    document.getElementById('userSection').style.display = 'none';
  } catch (error) {
    console.error('Sign out error:', error);
    alert(`Sign out failed: ${error.message || 'An error occurred'}`);
  }
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