function handleCredentialResponse(response) {
  // Decode the JWT to get user info
  const base64Url = response.credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  
  const user = JSON.parse(jsonPayload);
  
  // Store user data
  localStorage.setItem('authUser', JSON.stringify({
    uid: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture
  }));
  localStorage.setItem('authLoggedIn', 'true');
  localStorage.setItem('authToken', response.credential);
  
  // Update UI
  showUserProfile(user);
  
  // Redirect to homepage
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

function showUserProfile(user) {
  const authActions = document.getElementById('authActions');
  const profileContainer = document.getElementById('profileContainer');
  const profilePic = document.getElementById('profilePic');
  
  if (authActions) authActions.style.display = 'none';
  if (profileContainer) {
    profileContainer.style.display = 'flex';
    profilePic.src = user.picture;
  }
}

function logout() {
  localStorage.removeItem('authUser');
  localStorage.removeItem('authLoggedIn');
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  sessionStorage.removeItem('authToken');
  
  const authActions = document.getElementById('authActions');
  const profileContainer = document.getElementById('profileContainer');
  
  if (authActions) authActions.style.display = 'flex';
  if (profileContainer) profileContainer.style.display = 'none';
  
  window.location.href = 'index.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  const authUser = localStorage.getItem('authUser');
  
  if (authUser) {
    try {
      const user = JSON.parse(authUser);
      showUserProfile(user);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
  
  // Setup profile container click to toggle menu
  const profileContainer = document.getElementById('profileContainer');
  if (profileContainer) {
    profileContainer.addEventListener('click', function(e) {
      if (e.target.tagName === 'IMG') {
        const menu = document.getElementById('profileMenu');
        if (menu) {
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
      }
    });
  }
  
  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    const profileContainer = document.getElementById('profileContainer');
    const profileMenu = document.getElementById('profileMenu');
    
    if (profileContainer && profileMenu && 
        !profileContainer.contains(e.target) && 
        profileMenu.style.display === 'block') {
      profileMenu.style.display = 'none';
    }
  });
  
  // Initialize Google Sign-In button if it exists
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.initialize({
      client_id: '107932772280-gbin31qmsi4dehvoikgtd50dm4qggvus.apps.googleusercontent.com',
      callback: handleCredentialResponse
    });
    
    const gSigninDiv = document.querySelector('.g_id_signin');
    const gIdOnload = document.getElementById('g_id_onload');
    
    if (gSigninDiv && !authUser) {
      window.google.accounts.id.renderButton(
        gSigninDiv,
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }
});

// Hide menu by default
document.addEventListener('DOMContentLoaded', function() {
  const profileMenu = document.getElementById('profileMenu');
  if (profileMenu) {
    profileMenu.style.display = 'none';
  }
});
