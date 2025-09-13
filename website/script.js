let currentUser = null;

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        // Use Supabase direct authentication
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        if (data.user && data.session) {
            currentUser = {
                email: data.user.email,
                token: data.session.access_token
            };
            showUserSection();
            loadSnaps();
        } else {
            alert('Sign in failed. Please check your credentials and confirm your email.');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        alert(`An error occurred during sign in: ${error.message}`);
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
        // Use Supabase direct authentication
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        alert('Sign up successful! Please check your email for a confirmation link, then sign in.');
    } catch (error) {
        console.error('Sign up error:', error);
        alert(`Sign up failed: ${error.message}`);
    } finally {
        signUpButton.disabled = false;
        signUpButton.textContent = 'Sign Up';
    }
};

document.getElementById('signOut').onclick = async function() {
    try {
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('authForm').style.display = 'block';
    } catch (error) {
        console.error('Sign out error:', error);
        alert(`Error signing out: ${error.message}`);
    }
};

function showUserSection() {
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userSection').style.display = 'block';
    document.getElementById('authForm').style.display = 'none';
}

async function loadSnaps() {
    if (!currentUser) return;
    
    try {
        // Use Supabase direct query with RLS policies
        const { data: snaps, error } = await supabase
            .from('snaps')
            .select('*')
            .eq('user_email', currentUser.email)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displaySnaps(snaps || []);
    } catch (error) {
        console.error('Error loading snaps:', error);
        alert(`Error loading snaps: ${error.message}`);
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