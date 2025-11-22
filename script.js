// ==============================================================
// COMPLETE SCRIPT.JS (AUTHENTICATION, ENCRYPTION, CHAT LOGIC)
// ==============================================================

// --- GLOBAL VARIABLES & ELEMENT REFERENCES ---
const setupScreen = document.getElementById('setup-screen');
const chatScreen = document.getElementById('chat-screen');
const registerButton = document.getElementById('register-button');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const newChatButton = document.getElementById('new-chat-button');
const newChatContainer = document.getElementById('new-chat-container');
const targetEmailInput = document.getElementById('target-email-input');
const startConversationButton = document.getElementById('start-conversation-button');

const userEmailInput = document.getElementById('user-email');
const userPasswordInput = document.getElementById('user-password');
const userTypeSelect = document.getElementById('user-type');
const myLanguageInput = document.getElementById('my-language');

const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const displayMyLang = document.getElementById('display-my-lang');
const messagesContainer = document.getElementById('messages-container');

// Global variables for user data and chat state
let currentUserID = null;
let currentMyLanguage = null;
let currentChatId = null; 
let unsubscribeFromChat = null; // Function to stop listening to the chat

// --- SECURITY (Encryption using Crypto-JS) ---
// Simple shared key for the MVP. This must be replaced with a secure key exchange later.
const ENCRYPTION_SECRET = "speakly_super_secure_key_123"; 

function encryptMessage(message) {
    if (!message) return null;
    try {
        const encrypted = CryptoJS.AES.encrypt(message, ENCRYPTION_SECRET).toString();
        // We prepend 'E_' so we know this message is encrypted.
        return 'E_' + encrypted; 
    } catch (e) {
        console.error("Encryption failed:", e);
        return message; 
    }
}

function decryptMessage(encryptedMessage) {
    if (!encryptedMessage || !encryptedMessage.startsWith('E_')) {
        return encryptedMessage; // Not encrypted, return as is
    }
    const cipherText = encryptedMessage.substring(2);
    try {
        const decryptedBytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
        return decryptedBytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "Decryption Error"; 
    }
}

// --- CORE UI/DATA FUNCTIONS ---

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

function switchToChatScreen(lang) {
    currentMyLanguage = lang;
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

/**
 * Handles toggling the visibility of the new chat search input.
 */
function toggleNewChatInput() {
    const isHidden = newChatContainer.style.display === 'none';
    newChatContainer.style.display = isHidden ? 'flex' : 'none';
    if (!isHidden) {
        targetEmailInput.focus();
    }
}

/**
 * CORE LOGIC: Starts listening for new messages in the currently active chat.
 */
function listenToChat(chatId) {
    if (unsubscribeFromChat) {
        unsubscribeFromChat(); // Stop listening to previous chat
        unsubscribeFromChat = null;
    }

    // Clear previous messages
    messagesContainer.innerHTML = '<div class="system-message">Chat established securely. Start typing!</div>';

    // Firebase Firestore function to listen for real-time updates
    unsubscribeFromChat = db.collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const messageData = change.doc.data();
                    displayMessage(messageData);
                }
            });
            // Scroll to the bottom to see the newest message
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}

/**
 * Displays a single message in the UI, handling decryption and future translation.
 */
function displayMessage(data) {
    // Determine if the message is from me or the other person
    const isMe = data.senderId === currentUserID;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMe ? 'message-me' : 'message-them');

    // 1. DECRYPT the message content
    const originalText = decryptMessage(data.encryptedText);
    
    // 2. TRANSLATION (Placeholder for now)
    let translatedText = originalText; // Currently, translatedText is the same as originalText
    
    // HTML structure for the message bubble
    messageDiv.innerHTML = `
        <p class="translated-text">
            ${translatedText}
        </p>
        <button class="show-original-button" data-original="${originalText}" style="font-size: 0.7em; margin-top: 5px; background: none; border: none; color: #f1c40f; cursor: pointer;">
            Show Original
        </button>
        <span class="timestamp">${new Date(data.timestamp.toDate()).toLocaleTimeString()}</span>
    `;

    messagesContainer.appendChild(messageDiv);
}


// --- FIREBASE AUTH/CHAT HANDLERS ---

async function handleRegister() {
    const data = validateSetup();
    if (!data) return;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
        currentUserID = userCredential.user.uid;
        
        await db.collection('users').doc(currentUserID).set({
            email: data.email,
            userType: data.userType,
            myLanguage: data.myLanguage,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Registration successful! Logged in as: ${data.email}.`);
        switchToChatScreen(data.myLanguage);

    } catch (error) {
        alert(`Registration Error: ${error.message}`);
        console.error("Registration Error:", error);
    }
}

async function handleLogin() {
    const data = validateSetup();
    if (!data) return;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(data.email, data.password);
        currentUserID = userCredential.user.uid;
        
        const userDoc = await db.collection('users').doc(currentUserID).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            alert(`Welcome back, ${userData.email}!`);
            switchToChatScreen(userData.myLanguage);
        } else {
            alert("User data missing. Please register again.");
            await auth.signOut();
        }

    } catch (error) {
        alert(`Login Error: ${error.message}`);
        console.error("Login Error:", error);
    }
}


function handleLogout() {
    if (unsubscribeFromChat) unsubscribeFromChat();
    auth.signOut().then(() => {
        currentUserID = null;
        currentMyLanguage = null;
        currentChatId = null; 
        
        // UI Switch
        chatScreen.style.display = 'none';
        setupScreen.style.display = 'flex'; 

        // Reset inputs
        userEmailInput.value = '';
        userPasswordInput.value = '';
        userTypeSelect.value = '';
        myLanguageInput.value = '';
        chatInput.disabled = true;
        sendButton.disabled = true;
        
        messagesContainer.innerHTML = ''; // Clear messages
        alert("You have been logged out securely.");
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

/**
 * Finds or creates a chat document between the current user and the target user.
 */
async function handleStartConversation() {
    const targetEmail = targetEmailInput.value.trim();
    if (!targetEmail) {
        alert("Please enter a valid email for the person you want to chat with.");
        return;
    }
    if (auth.currentUser && targetEmail === auth.currentUser.email) {
        alert("You cannot start a chat with yourself.");
        return;
    }

    // 1. Find the target user's UID (Required for security rules)
    const targetUserQuery = await db.collection('users').where('email', '==', targetEmail).limit(1).get();

    if (targetUserQuery.empty) {
        alert(`Error: User with email ${targetEmail} not found. They must register first.`);
        return;
    }

    const targetUserId = targetUserQuery.docs[0].id;
    const targetUserData = targetUserQuery.docs[0].data();
    
    // 2. Generate a unique, sorted chat ID
    const participants = [currentUserID, targetUserId].sort();
    const chatID = participants.join('_');
    
    // 3. Create or update the chat document
    await db.collection('chats').doc(chatID).set({
        participants: participants,
        lang1: currentMyLanguage, 
        lang2: targetUserData.myLanguage, 
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 4. Set the new active chat and start listening
    currentChatId = chatID;
    listenToChat(currentChatId);
    
    newChatContainer.style.display = 'none'; // Hide the search box
    targetEmailInput.value = ''; // Clear input
    alert(`Chat started with ${targetUserData.email}. Messages will be translated from ${currentMyLanguage} to ${targetUserData.myLanguage}.`);
}


/**
 * Sends a message to the active chat.
 */
async function handleSendMessage() {
    if (!currentChatId) {
        alert("Please start a new chat before sending a message.");
        return;
    }

    const messageText = chatInput.value.trim();
    if (messageText === '') return;

    // 1. ENCRYPT the original message
    const encrypted = encryptMessage(messageText);

    // 2. Prepare the message object
    const message = {
        senderId: currentUserID,
        encryptedText: encrypted,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
        // 3. Save the encrypted message to Firestore
        await db.collection('chats').doc(currentChatId).collection('messages').add(message);
        
        chatInput.value = ''; // Clear the input box
    } catch (error) {
        alert(`Send Message Error: ${error.message}`);
        console.error("Send Message Error:", error);
    }
}


// --- ATTACH EVENT LISTENERS ---
registerButton.addEventListener('click', handleRegister);
loginButton.addEventListener('click', handleLogin);
logoutButton.addEventListener('click', handleLogout);
newChatButton.addEventListener('click', toggleNewChatInput);
startConversationButton.addEventListener('click', handleStartConversation);
sendButton.addEventListener('click', handleSendMessage);

// Pressing Enter key in the chat input should also send the message
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});


// --- INITIAL CHECK: Check if a user is already logged in (Persistent Session) ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(userDoc => {
            if (userDoc.exists) {
                switchToChatScreen(userDoc.data().myLanguage); 
                currentUserID = user.uid;
            }
        });
    } else {
        setupScreen.style.display = 'flex';
        chatScreen.style.display = 'none';
    }
});

// --- EVENT LISTENER FOR SHOW ORIGINAL BUTTONS ---
// Since messages are added dynamically, we use event delegation on the container
messagesContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('show-original-button')) {
        const button = event.target;
        const originalText = button.getAttribute('data-original');
        const translatedParagraph = button.previousElementSibling;
        
        if (button.textContent === 'Show Original') {
            // Display the original message
            translatedParagraph.textContent = originalText;
            button.textContent = 'Show Translated';
        } else {
            // Re-display the translated message (currently the original text)
            translatedParagraph.textContent = originalText; 
            button.textContent = 'Show Original';
        }
    }
});
