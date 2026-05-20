// Keep credentials global
const SUPABASE_URL = 'https://ukwjoxhutcjkvabnybtj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrd2pvanh1dGNqa3ZhYm55YnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzk5NDAsImV4cCI6MjA5Mzg1NTk0MH0.iLr9OrIZlRBrbcI1XDE0zl7t_wpwVg3ko3DgppxbUh8';

let supabase;

document.addEventListener('DOMContentLoaded', () => {
  
  // CRASH PROTECTION ENGINE: Protect configuration instantiation layers
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      alert("Initialization Warning: Supabase CDN script failed to execute globally. Forms will run in offline testing mode.");
    }
  } catch (initError) {
    alert("Supabase Bootstrap Crash: " + initError.message);
  }

  // DOM ELEMENTS SELECTION
  const signupUsernameInput = document.getElementById('signupUsername');
  const usernameFeedback = document.getElementById('usernameFeedback');
  const signupPasswordInput = document.getElementById('signupPassword');
  const signupMessage = document.getElementById('signupMessage');
  const signupBtn = document.getElementById('signupBtn');

  const loginUsernameInput = document.getElementById('loginUsername');
  const loginPasswordInput = document.getElementById('loginPassword');
  const loginMessage = document.getElementById('loginMessage');
  const loginBtn = document.getElementById('loginBtn');

  const signupTab = document.getElementById('signupTab');
  const loginTab = document.getElementById('loginTab');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  // --- 1. INTERFACE TAB CONTROL OPERATIONS ---
  // Moved to the top so tabs work even if database queries hit snags later!
  if (signupTab && loginTab && signupForm && loginForm) {
    signupTab.addEventListener('click', () => {
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
    });

    loginTab.addEventListener('click', () => {
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      signupTab.classList.remove('active');
      loginTab.classList.add('active');
    });
  }

  // Real-time unique availability verification lookup handler
  async function checkUsername() {
    if (!supabase) return false;
    const username = signupUsernameInput.value.trim();
    if (!username) {
      usernameFeedback.innerHTML = '';
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error) return false;

      if (data) {
        usernameFeedback.innerHTML = '<span class="error">Username already taken</span>';
        return false;
      } else {
        usernameFeedback.innerHTML = '<span class="success">Username available</span>';
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  if (signupUsernameInput) {
    signupUsernameInput.addEventListener('blur', checkUsername);
  }

  // --- 2. ACCOUNT SIGNUP LOGIC ---
  async function handleSignup(e) {
    if (e) e.preventDefault();

    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value;

    if (!username || password.length < 8) {
      signupMessage.innerHTML = '<span class="error">Username required & password must be 8+ characters</span>';
      return;
    }

    if (!supabase) {
      alert("Offline Mode Error: Database network client is uninitialized.");
      return;
    }

    signupMessage.innerHTML = '<span style="color: #bcbcbc;">Connecting to database terminal...</span>';

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError) {
        alert("Database Uniqueness Check Fail: " + checkError.message);
        return;
      }

      if (existingUser) {
        signupMessage.innerHTML = '<span class="error">Please change your username</span>';
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{ username: username, password: password }]);

      if (error) {
        alert(`Supabase SQL Insertion Blocked:\n\n${error.message}`);
        signupMessage.innerHTML = `<span class="error">Registration error: ${error.message}</span>`;
        return;
      }

      signupMessage.innerHTML = '<span class="success">Account created! Switch to the Login tab.</span>';
      alert("Success! Account row written cleanly to your Supabase users table.");
      
      signupUsernameInput.value = '';
      signupPasswordInput.value = '';
      usernameFeedback.innerHTML = '';

    } catch (catchErr) {
      alert("Registration Process Runtime Exception: " + catchErr.message);
    }
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', handleSignup);
  }

  // --- 3. DATABASE USER LOGIN AUTH Flow ---
  async function handleLogin(e) {
    if (e) e.preventDefault();

    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username || !password) {
      loginMessage.innerHTML = '<span class="error">Please fill in all fields</span>';
      return;
    }

    if (!supabase) {
      alert("Offline Mode Error: Cannot complete authentication routing.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        alert("Login Database Exception: " + error.message);
        return;
      }

      if (!data) {
        loginMessage.innerHTML = '<span class="error">Invalid username or password</span>';
        return;
      }

      loginMessage.innerHTML = `<span class="success">Welcome back, ${username}! Redirecting...</span>`;
      localStorage.setItem('chatUser', username);

      setTimeout(() => {
        window.location.href = '../index.html';
      }, 800);

    } catch (catchErr) {
      alert("Authentication Loop Exception: " + catchErr.message);
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  // PASSWORD REVEAL TOGGLES
  function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (input && toggle) {
      toggle.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    }
  }
  setupPasswordToggle('signupPassword', 'toggleSignupPassword');
  setupPasswordToggle('loginPassword', 'toggleLoginPassword');
});
