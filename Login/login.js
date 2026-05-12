// --- INITIALIZATION ---
const SUPABASE_URL = 'https://ukwjojxutcjkvabnybtj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrd2pvanh1dGNqa3ZhYm55YnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzk5NDAsImV4cCI6MjA5Mzg1NTk0MH0.iLr9OrIZlRBrbcI1XDE0zl7t_wpwVg3ko3DgppxbUh8'; 

// Initialize Supabase Client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- TAB SWITCHING ---
document.getElementById('signupTab').addEventListener('click', () => {
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
});

document.getElementById('loginTab').addEventListener('click', () => {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById('loginTab').classList.add('active');
});

// --- PASSWORD TOGGLES ---
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    toggle.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
    });
}
setupPasswordToggle('signupPassword', 'toggleSignupPassword');
setupPasswordToggle('loginPassword', 'toggleLoginPassword');

// --- VALIDATION HELPERS ---
function isValidEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
}

async function checkUsername() {
    const username = document.getElementById('signupUsername').value.trim();
    const feedback = document.getElementById('usernameFeedback');
    if (!username) return;

    // Check if username exists in your custom user_roles table
    const { data } = await _supabase.from('user_roles').select('username').eq('username', username);
    
    if (data && data.length > 0) {
        feedback.innerHTML = '<span class="error">Taken</span>';
    } else {
        feedback.innerHTML = '<span class="success">Available</span>';
    }
}

async function checkEmail() {
    const email = document.getElementById('signupEmail').value.trim();
    const feedback = document.getElementById('emailFeedback');
    if (!email || !isValidEmail(email)) {
        feedback.innerHTML = '<span class="error">Invalid email</span>';
        return;
    }
    feedback.innerHTML = '<span class="success">Valid format</span>';
}

// --- SIGN UP LOGIC (WITH RECAPTCHA & EMAIL VERIFY) ---
async function handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const message = document.getElementById('signupMessage');

    // 1. Check reCAPTCHA
    const captchaToken = grecaptcha.getResponse();
    if (!captchaToken) {
        message.innerHTML = '<span class="error">Please complete the reCAPTCHA</span>';
        return;
    }

    if (!isValidEmail(email) || !username || password.length < 8) {
        message.innerHTML = '<span class="error">Check inputs (Password 8+ chars)</span>';
        return;
    }

    message.innerHTML = '<span style="color: #8b00ff;">Creating account...</span>';

    // 2. Register with Supabase
    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            captchaToken: captchaToken,
            emailRedirectTo: 'https://glaxyias.github.io/UBGSite/',
            data: { display_name: username } // Save username in metadata
        }
    });

    if (error) {
        message.innerHTML = `<span class="error">${error.message}</span>`;
        grecaptcha.reset();
    } else {
        // 3. Create entry in your public user_roles table
        await _supabase.from('user_roles').insert([
            { username: username, role_tag: 'user', is_banned: false }
        ]);

        message.innerHTML = '<span class="success">Check your email for the verification link!</span>';
        grecaptcha.reset();
    }
}

// --- LOGIN LOGIC ---
async function handleLogin() {
    const identifier = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const message = document.getElementById('loginMessage');

    message.innerHTML = '<span style="color: #8b00ff;">Logging in...</span>';

    // Supabase needs an email. If the user typed a username, 
    // this logic assumes their username IS their email or requires searching user_roles first.
    // For simplicity, we'll try to log in using the identifier as the email.
    const { data, error } = await _supabase.auth.signInWithPassword({
        email: identifier,
        password: password
    });

    if (error) {
        if (error.message.includes("Email not confirmed")) {
            message.innerHTML = '<span class="error">Please verify your email first!</span>';
        } else {
            message.innerHTML = '<span class="error">Invalid credentials</span>';
        }
    } else {
        // Get the username from metadata or use email prefix
        const userDisplayName = data.user.user_metadata.display_name || identifier.split('@')[0];
        
        localStorage.setItem('chatUser', userDisplayName);
        message.innerHTML = `<span class="success">Welcome, ${userDisplayName}!</span>`;
        
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1500);
    }
}

// Attach functions to window so the HTML onclicks can find them
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.checkEmail = checkEmail;
window.checkUsername = checkUsername;
