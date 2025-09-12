let currentUser = null;

document.getElementById('signIn').onclick = async function() {
    const signInButton = this;
    signInButton.disabled = true;
    signInButton.textContent = 'Signing In...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        signInButton.disabled = false;
        signInButton.textContent = 'Sign In';
        return;
    }
    
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
            currentUser = data.user;
            showUserSection();
            loadSnaps();
        } else if (data.message) {
            alert(`Sign in failed: ${data.message}`);
        } else {
            alert('Sign in failed. Please check your credentials and confirm your email.');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        alert('An error occurred during sign in. Please try again.');
    } finally {
        signInButton.disabled = false;
        signInButton.textContent = 'Sign In';
    }
};

document.getElementById('signUp').onclick = async function() {
    const signUpButton = this;
    signUpButton.disabled = true;
    signUpButton.textContent = 'Signing Up...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        signUpButton.disabled = false;
        signUpButton.textContent = 'Sign Up';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Sign up successful! Please check your email for a confirmation link, then sign in.');
        } else if (data.message) {
            alert(`Sign up failed: ${data.message}`);
        } else {
            alert('Sign up failed. Please try again.');
        }
    } catch (error) {
        console.error('Sign up error:', error);
        alert('An error occurred during sign up. Please try again.');
    } finally {
        signUpButton.disabled = false;
        signUpButton.textContent = 'Sign Up';
    }
};

document.getElementById('signOut').onclick = function() {
    currentUser = null;
    document.getElementById('userSection').style.display = 'none';
    document.getElementById('authForm').style.display = 'block';
};

function showUserSection() {
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userSection').style.display = 'block';
    document.getElementById('authForm').style.display = 'none';
}

async function loadSnaps() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/api/snaps?email=${encodeURIComponent(currentUser.email)}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const snaps = await response.json();
        displaySnaps(snaps);
    } catch (error) {
        console.error('Error loading snaps:', error);
    }
}

function displaySnaps(snaps) {
    const container = document.getElementById('snapsContainer');
    container.innerHTML = '';

    if (snaps.length === 0) {
        container.innerHTML = '<p>No snaps yet. Start capturing with the extension!</p>';
        return;
    }

    // Create grid wrapper
    const grid = document.createElement('div');
    grid.className = 'snaps-grid';

    snaps.forEach(snap => {
        const snapDiv = document.createElement('div');
        snapDiv.className = 'snap';
        let screenshotHtml = '';
        if (snap.screenshot) {
            screenshotHtml = `<img src="${snap.screenshot}" alt="Screenshot" class="snap-image" style="cursor:zoom-in;">`;
        } else {
            screenshotHtml = `<div class="snap-image" style="width:200px;height:120px;display:flex;align-items:center;justify-content:center;background:#eee;color:#888;font-size:14px;border-radius:4px;border:1px solid #ddd;">No screenshot</div>`;
        }
        snapDiv.innerHTML = `
            <div class="snap-header">
                <h3>${snap.title}</h3>
                <span class="snap-date">${new Date(snap.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="snap-content">
                ${screenshotHtml}
                <div class="snap-details">
                    <p><strong>Selected Text:</strong> ${snap.text}</p>
                    <p><strong>Note:</strong> ${snap.note || 'No note'}</p>
                    <p><strong>URL:</strong> <a href="${snap.url}" target="_blank">${snap.url}</a></p>
                </div>
            </div>
        `;
        grid.appendChild(snapDiv);
    });
    container.appendChild(grid);

    // Modal logic for image enlarge
    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('snap-image') && e.target.tagName === 'IMG') {
            showImageModal(e.target.src);
        }
    });
}

function showImageModal(imgSrc) {
    // Remove any existing modal
    const oldModal = document.getElementById('image-modal-overlay');
    if (oldModal) oldModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'image-modal-overlay';
    overlay.id = 'image-modal-overlay';
    overlay.innerHTML = `<img src="${imgSrc}" class="image-modal-img" alt="Enlarged Screenshot">`;
    overlay.onclick = function() {
        overlay.remove();
    };
    document.body.appendChild(overlay);
}