// INITIALIZE SUPABASE CLIENT API WITH YOUR CREDENTIALS
const SUPABASE_URL = 'https://ukwjoxhutcjkvabnybtj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrd2pvanh1dGNqa3ZhYm55YnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzk5NDAsImV4cCI6MjA5Mzg1NTk0MH0.iLr9OrIZlRBrbcI1XDE0zl7t_wpwVg3ko3DgppxbUh8';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Guard everything in a safe DOM load check so elements exist when code runs
document.addEventListener('DOMContentLoaded', () => {

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

  // 1. REAL-TIME LOOKUP: Check if a user row already contains this username
  async function checkUsername() {
    const username = signupUsernameInput.value.trim();
    if (!username) {
      usernameFeedback.innerHTML = '';
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error("Database query failed: ", error.message);
      return false;
    }

    if (data) {
      usernameFeedback.innerHTML = '<span class="error">Username already taken</span>';
      return false;
    } else {
      usernameFeedback.innerHTML = '<span class="success">Username available</span>';
      return true;
    }
  }

  // Attach the validation event rule when the user clicks off the input box
  if (signupUsernameInput) {
    signupUsernameInput.addEventListener('blur', checkUsername);
  }

  // 2. ACCOUNT SIGNUP LOGIC Flow
  async function handleSignup() {
    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value;

    if (!username || password.length < 8) {
      signupMessage.innerHTML = '<span class="error">Username required & password must be 8+ characters</span>';
      return;
    }

    // Direct database uniqueness check bypassing the text field reset bug
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      signupMessage.innerHTML = '<span class="error">Please change your username</span>';
      return;
    }

    // Insert values cleanly into your columns layout
    const { data, error } = await supabase
      .from('users')
      .insert([{ username: username, password: password }]);

    if (error) {
      signupMessage.innerHTML = `<span class="error">Registration error: ${error.message}</span>`;
      return;
    }

    signupMessage.innerHTML = '<span class="success">Account created! Switch to the Login tab.</span>';
    signupUsernameInput.value = '';
    signupPasswordInput.value = '';
    usernameFeedback.innerHTML = '';
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', handleSignup);
  }

  // 3. DATABASE USER LOGIN AUTH Flow
  async function handleLogin() {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username || !password) {
      loginMessage.innerHTML = '<span class="error">Please fill in all fields</span>';
      return;
    }

    // Query your users table to check for matching credentials
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      loginMessage.innerHTML = `<span class="error">Database error: ${error.message}</span>`;
      return;
    }

    if (!data) {
      loginMessage.innerHTML = '<span class="error">Invalid username or password</span>';
      return;
    }

    loginMessage.innerHTML = `<span class="success">Welcome back, ${username}! Redirecting...</span>`;
    
    // Track credentials token key locally to handle hello greeting logic state 
    localStorage.setItem('currentUser', username);

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  // INTERFACE TAB CONTROL OPERATIONS
  if (signupTab && loginTab) {
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
