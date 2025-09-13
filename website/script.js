let currentUser = null;
let isSignUpMode = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('scrollNote_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showNotesDashboard();
        loadNotes();
    }

    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('navSignIn').onclick = () => showAuthModal(false);
    document.getElementById('navSignUp').onclick = () => showAuthModal(true);
    
    // Hero buttons
    document.getElementById('heroSignUp').onclick = () => showAuthModal(true);
    document.getElementById('heroLearnMore').onclick = () => {
        document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
    };

    // Auth modal
    document.getElementById('signIn').onclick = handleSignIn;
    document.getElementById('signUp').onclick = handleSignUp;
    document.getElementById('authSwitchBtn').onclick = toggleAuthMode;
    document.querySelector('.auth-close').onclick = hideAuthModal;
    document.querySelector('.auth-overlay').onclick = hideAuthModal;

    // Dashboard
    document.getElementById('signOut').onclick = handleSignOut;
}

function showAuthModal(isSignUp = false) {
    isSignUpMode = isSignUp;
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const switchText = document.getElementById('authSwitchText');
    const switchBtn = document.getElementById('authSwitchBtn');
    const signInBtn = document.getElementById('signIn');
    const signUpBtn = document.getElementById('signUp');

    if (isSignUp) {
        title.textContent = 'Create your account';
        subtitle.textContent = 'Join scrollNote and start organizing your web notes';
        switchText.textContent = 'Already have an account?';
        switchBtn.textContent = 'Sign in instead';
        signInBtn.style.display = 'none';
        signUpBtn.style.display = 'block';
    } else {
        title.textContent = 'Welcome back';
        subtitle.textContent = 'Sign in to access your notes';
        switchText.textContent = 'Don\'t have an account?';
        switchBtn.textContent = 'Sign up instead';
        signInBtn.style.display = 'block';
        signUpBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function toggleAuthMode() {
    showAuthModal(!isSignUpMode);
}

async function handleSignIn() {
    const signInButton = document.getElementById('signIn');
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
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.user && data.user.token) {
            currentUser = data.user;
            localStorage.setItem('scrollNote_user', JSON.stringify(currentUser));
            hideAuthModal();
            showNotesDashboard();
            loadNotes();
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
}

async function handleSignUp() {
    const signUpButton = document.getElementById('signUp');
    signUpButton.disabled = true;
    signUpButton.textContent = 'Creating Account...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        signUpButton.disabled = false;
        signUpButton.textContent = 'Create Account';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Sign up successful! Please check your email for a confirmation link, then sign in.');
            toggleAuthMode();
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
        signUpButton.textContent = 'Create Account';
    }
}

function handleSignOut() {
    currentUser = null;
    localStorage.removeItem('scrollNote_user');
    showLandingPage();
}

function showLandingPage() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('notesDashboard').style.display = 'none';
}

function showNotesDashboard() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('notesDashboard').style.display = 'block';
    document.getElementById('userEmail').textContent = currentUser.email;
}

async function loadNotes() {
    if (!currentUser) return;
    
    try {
        console.log('Loading notes for user:', currentUser.email);
        const response = await fetch(`${API_URL}/api/snaps?email=${encodeURIComponent(currentUser.email)}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            },
            credentials: 'include'
        });
        
        console.log('Notes response status:', response.status);
        const notes = await response.json();
        console.log('Notes data received:', notes);
        displayNotes(notes);
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

function displayNotes(notes) {
    const container = document.getElementById('notesGrid');
    container.innerHTML = '';

    if (notes.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #888888;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                <h3 style="color: #ffffff; margin-bottom: 1rem;">No notes yet</h3>
                <p>Start capturing web content with the scrollNote extension!</p>
            </div>
        `;
        return;
    }

    notes.forEach(note => {
        const noteCard = createNoteCard(note);
        container.appendChild(noteCard);
    });

    // Set up image modal functionality
    setupImageModals();
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    
    const imageHtml = note.screenshot 
        ? `<img src="${note.screenshot}" alt="Screenshot" class="note-image" style="cursor: zoom-in;">`
        : `<div class="note-image-placeholder">No screenshot available</div>`;

    const selectedText = truncateText(note.text, 120);
    const isLongText = note.text.length > 120;

    card.innerHTML = `
        <div class="note-header">
            <h3 class="note-title">${note.title || 'Untitled Note'}</h3>
            <span class="note-time">${formatDate(note.timestamp)}</span>
        </div>
        ${imageHtml}
        <div class="note-content">
            <div class="note-selected-text ${isLongText ? '' : 'expanded'}">
                <p>${selectedText}</p>
                ${isLongText ? '<button class="expand-btn">...more</button>' : ''}
            </div>
            <div class="note-text">
                <strong>Note:</strong> ${note.note || 'No additional notes'}
            </div>
            <a href="${note.url}" target="_blank" class="note-url">${note.url}</a>
        </div>
    `;

    // Add expand functionality
    const expandBtn = card.querySelector('.expand-btn');
    if (expandBtn) {
        expandBtn.onclick = function(e) {
            e.stopPropagation();
            const selectedTextDiv = card.querySelector('.note-selected-text');
            const isExpanded = selectedTextDiv.classList.contains('expanded');
            
            if (isExpanded) {
                selectedTextDiv.classList.remove('expanded');
                selectedTextDiv.querySelector('p').textContent = truncateText(note.text, 120);
                expandBtn.textContent = '...more';
            } else {
                selectedTextDiv.classList.add('expanded');
                selectedTextDiv.querySelector('p').textContent = note.text;
                expandBtn.textContent = '...less';
            }
        };
    }

    return card;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

function setupImageModals() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('note-image') && e.target.tagName === 'IMG') {
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