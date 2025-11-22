// ==============================================================
// STEP 6: FIREBASE AUTHENTICATION AND SETUP LOGIC
// ==============================================================

// --- GLOBAL VARIABLES & ELEMENT REFERENCES ---
const setupScreen = document.getElementById('setup-screen');
const chatScreen = document.getElementById('chat-screen');
const registerButton = document.getElementById('register-button');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');

const userEmailInput = document.getElementById('user-email');
const userPasswordInput = document.getElementById('user-password');
const userTypeSelect = document.getElementById('user-type');
const myLanguageInput = document.getElementById('my-language');

const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const displayMyLang = document.getElementById('display-my-lang');

// Global variables for user data and chat state
let currentUserID = null;
let currentMyLanguage = null;

// --- CRITICAL SECURITY FUNCTION (Mock Encryption) ---
// For a non-technical start, we use a simple placeholder. 
// LATER: We will replace this with a robust E2EE library like SubtleCrypto or AES.
function encryptMessage(message) {
    // Basic placeholder: Reverses the message to show "encryption" is happening
    // DO NOT USE THIS FOR REAL SECURITY!
    return 'E_' + message.split('').reverse().join('');
}

function decryptMessage(encryptedMessage) {
    // Decrypts the placeholder (reverses it back)
    if (encryptedMessage.startsWith('E_')) {
        return encryptedMessage.substring(2).split('').reverse().join('');
    }
    return encryptedMessage; // Return as is if not encrypted (shouldn't happen)
}

// --- CORE UI/DATA FUNCTIONS ---

/**
 * Validates the required setup fields (language and account type).
 * @returns {boolean} True if valid, false otherwise.
 */
function validateSetup() {
    const userType = userTypeSelect.value;
    const myLanguage = myLanguageInput.value.trim();
    const email = userEmailInput.value.trim();
    const password = userPasswordInput.value;

    if (!email || !password || !userType || !myLanguage) {
        alert("Please fill in your Email, Password, Account Type, and My Language.");
        return false;
    }
    return { email, password, userType, myLanguage };
}

/**
 * Switches the UI to the main chat screen and updates display elements.
 * @param {string} lang The user's chosen language.
 */
function switchToChatScreen(lang) {
    currentMyLanguage = lang; // Store globally
    displayMyLang.textContent = lang;
    
    // UI Switch
    setupScreen.style.display = 'none';
    chatScreen.style.display = 'flex'; 

    // Enable chat elements
    chatInput.disabled = false;
    sendButton.disabled = false;
    chatInput.focus();
    
    console.log(`Chat screen activated for user speaking ${lang}.`);
}


// --- FIREBASE AUTH HANDLERS ---

/**
 * Registers a new user with Firebase Email/Password Auth.
 */
async function handleRegister() {
    const data = validateSetup();
    if (!data) return;

    try {
        // Firebase call to create a new user
        const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
        currentUserID = userCredential.user.uid;
        
        // Save additional user details to Firestore (for Business/Language tracking)
        await db.collection('users').doc(currentUserID).set({
            email: data.email,
            userType: data.userType,
            myLanguage: data.myLanguage,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Registration successful! Logged in as: ${data.email}.`);
        switchToChatScreen(data.myLanguage);

    } catch (error) {
        // Handle specific Firebase errors (e.g., email already in use, weak password)
        alert(`Registration Error: ${error.message}`);
        console.error("Registration Error:", error);
    }
}

/**
 * Logs in an existing user with Firebase Email/Password Auth.
 */
async function handleLogin() {
    const data = validateSetup();
    if (!data) return;

    try {
        // Firebase call to sign in the user
        const userCredential = await auth.signInWithEmailAndPassword(data.email, data.password);
        currentUserID = userCredential.user.uid;
        
        // Fetch the saved user details from Firestore
        const userDoc = await db.collection('users').doc(currentUserID).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            alert(`Welcome back, ${userData.email}!`);
            switchToChatScreen(userData.myLanguage);
        } else {
            // Should not happen if registration worked, but good safeguard
            alert("User data missing. Please register again.");
            await auth.signOut(); // Force log out
        }

    } catch (error) {
        // Handle specific Firebase errors (e.g., wrong password, user not found)
        alert(`Login Error: ${error.message}`);
        console.error("Login Error:", error);
    }
}


/**
 * Handles the logic for logging out (swapping back to the setup screen).
 */
function handleLogout() {
    auth.signOut().then(() => {
        // Reset state
        currentUserID = null;
        currentMyLanguage = null;
        
        // UI Switch
        chatScreen.style.display = 'none';
        setupScreen.style.display = 'flex'; 

        // Clear sensitive inputs
        userEmailInput.value = '';
        userPasswordInput.value = '';
        userTypeSelect.value = '';
        myLanguageInput.value = '';
        chatInput.disabled = true;
        sendButton.disabled = true;
        
        alert("You have been logged out securely.");
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}


// --- ATTACH EVENT LISTENERS ---
registerButton.addEventListener('click', handleRegister);
loginButton.addEventListener('click', handleLogin);
logoutButton.addEventListener('click', handleLogout);

// --- INITIAL CHECK: Check if a user is already logged in (Persistent Session) ---
auth.onAuthStateChanged(user => {
    if (user) {
        // User is logged in, fetch their language data
        db.collection('users').doc(user.uid).get().then(userDoc => {
            if (userDoc.exists) {
                 // Skip the setup screen and go straight to the chat
                switchToChatScreen(userDoc.data().myLanguage); 
                currentUserID = user.uid;
            }
        });
    } else {
        // User is logged out, ensure setup screen is visible
        setupScreen.style.display = 'flex';
        chatScreen.style.display = 'none';
    }
});
