// ==============================================================
// TRIAL VERSION SCRIPT.JS (STABLE SPARK PLAN VERSION)
// ==============================================================

// --- GLOBAL VARIABLES & ELEMENT REFERENCES (Same as before) ---
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

// Business screen elements (assuming they are in index.html)
const businessSetupScreen = document.getElementById('business-setup-screen');
const saveCatalogueButton = document.getElementById('save-catalogue-button');
const catalogueTextInput = document.getElementById('catalogue-text-input');

let currentUserID = null;
let currentMyLanguage = null;
let currentChatId = null; 
let unsubscribeFromChat = null;
let currentPartnerLanguage = null; 
let currentUserType = null; 

// --- SECURITY (Encryption using Crypto-JS) ---
const ENCRYPTION_SECRET = "speakly_super_secure_key_123"; 

function encryptMessage(message) {
    if (!message) return null;
    try {
        const encrypted = CryptoJS.AES.encrypt(message, ENCRYPTION_SECRET).toString();
        return 'E_' + encrypted; 
    } catch (e) {
        console.error("Encryption failed:", e);
        return message; 
    }
}

function decryptMessage(encryptedMessage) {
    if (!encryptedMessage || !encryptedMessage.startsWith('E_')) {
        return encryptedMessage;
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

// --- CORE UI/DATA FUNCTIONS (Chat and Display Logic) ---

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

function checkUserTypeAndSwitchScreen(lang, type) {
    currentMyLanguage = lang;
    currentUserType = type;
    displayMyLang.textContent = lang;
    setupScreen.style.display = 'none';

    if (type === 'business') {
        chatScreen.style.display = 'none';
        businessSetupScreen.style.display = 'flex';
        console.log(`Business user logged in. Redirecting to Catalogue Setup.`);
        db.collection('catalogues').doc(currentUserID).get().then(doc => {
            if (doc.exists) {
                catalogueTextInput.value = doc.data().text || '';
            }
        });
    } else {
        businessSetupScreen.style.display = 'none';
        chatScreen.style.display = 'flex'; 
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
        console.log(`Individual user logged in. Switching to Chat Screen.`);
    }
}

function toggleNewChatInput() {
    const isHidden = newChatContainer.style.display === 'none';
    newChatContainer.style.display = isHidden ? 'flex' : 'none';
    if (!isHidden) {
        targetEmailInput.focus();
    }
}

function listenToChat(chatId) {
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        unsubscribeFromChat = null;
    }

    db.collection('chats').doc(chatId).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            currentPartnerLanguage = (data.lang1 === currentMyLanguage) ? data.lang2 : data.lang1;
            
            messagesContainer.innerHTML = `<div class="system-message">Chat established securely. Partner speaks: **${currentPartnerLanguage}**.</div>`;

            unsubscribeFromChat = db.collection('chats').doc(chatId).collection('messages')
                .orderBy('timestamp')
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const messageData = change.doc.data();
                            displayMessage(messageData);
                        }
                    });
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                });
        }
    });
}

/**
 * TRIAL LOGIC: Displays the decrypted original message only.
 * This proves the security and real-time flow without translation.
 */
async function displayMessage(data) {
    const isMe = data.senderId === currentUserID;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMe ? 'message-me' : 'message-them');

    const originalText = decryptMessage(data.encryptedText);
    
    // Display the original message text directly.
    const displayedText = `[NO TRANSLATION - Spark Trial] ${originalText}`;
    
    messageDiv.innerHTML = `
        <p class="translated-text">
            ${displayedText}
        </p>
        <button class="show-original-button" data-original="${originalText}" data-translated="${originalText}" style="font-size: 0.7em; margin-top: 5px; background: none; border: none; color: #f1c40f; cursor: pointer;">
            Show Original
        </button>
        <span class="timestamp">${new Date(data.timestamp.toDate()).toLocaleTimeString()}</span>
    `;
    messagesContainer.appendChild(messageDiv);
}


// --- FIREBASE AUTH/CHAT HANDLERS (Same as before) ---
async function handleSaveCatalogue() {
    const catalogueText = catalogueTextInput.value.trim();
    if (!catalogueText) {
        alert("Please enter your catalogue or business information.");
        return;
    }
    
    try {
        await db.collection('catalogues').doc(currentUserID).set({
            text: catalogueText,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        alert("Catalogue saved successfully! You can now start chatting.");

        businessSetupScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();

    } catch (error) {
        alert(`Catalogue Save Error: ${error.message}`);
        console.error("Catalogue Save Error:", error);
    }
}

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
        checkUserTypeAndSwitchScreen(data.myLanguage, data.userType);

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
            checkUserTypeAndSwitchScreen(userData.myLanguage, userData.userType);
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
        currentPartnerLanguage = null;
        currentUserType = null;
        
        chatScreen.style.display = 'none';
        businessSetupScreen.style.display = 'none';
        setupScreen.style.display = 'flex'; 

        userEmailInput.value = '';
        userPasswordInput.value = '';
        userTypeSelect.value = '';
        myLanguageInput.value = '';
        chatInput.disabled = true;
        sendButton.disabled = true;
        
        messagesContainer.innerHTML = '';
        alert("You have been logged out securely.");
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

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

    const targetUserQuery = await db.collection('users').where('email', '==', targetEmail).limit(1).get();

    if (targetUserQuery.empty) {
        alert(`Error: User with email ${targetEmail} not found. They must register first.`);
        return;
    }

    const targetUserId = targetUserQuery.docs[0].id;
    const targetUserData = targetUserQuery.docs[0].data();
    
    const participants = [currentUserID, targetUserId].sort();
    const chatID = participants.join('_');
    
    await db.collection('chats').doc(chatID).set({
        participants: participants,
        lang1: currentMyLanguage, 
        lang2: targetUserData.myLanguage, 
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    currentChatId = chatID;
    listenToChat(currentChatId);
    
    newChatContainer.style.display = 'none';
    targetEmailInput.value = '';
    alert(`Chat started with ${targetUserData.email}. Messages will be encrypted/decrypted, but NO real-time translation is active on the Spark Plan.`);
}


async function handleSendMessage() {
    if (!currentChatId) {
        alert("Please start a new chat before sending a message.");
        return;
    }

    const messageText = chatInput.value.trim();
    if (messageText === '') return;

    const encrypted = encryptMessage(messageText);

    const message = {
        senderId: currentUserID,
        encryptedText: encrypted,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
        await db.collection('chats').doc(currentChatId).collection('messages').add(message);
        chatInput.value = '';
    } catch (error) {
        alert(`Send Message Error: ${error.message}`);
        console.error("Send Message Error:", error);
    }
}


// --- ATTACH EVENT LISTENERS (Same as before) ---
registerButton.addEventListener('click', handleRegister);
loginButton.addEventListener('click', handleLogin);
logoutButton.addEventListener('click', handleLogout);
newChatButton.addEventListener('click', toggleNewChatInput);
startConversationButton.addEventListener('click', handleStartConversation);
sendButton.addEventListener('click', handleSendMessage);
saveCatalogueButton.addEventListener('click', handleSaveCatalogue);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});


// --- INITIAL CHECK (Same as before) ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                currentUserID = user.uid;
                checkUserTypeAndSwitchScreen(userData.myLanguage, userData.userType); 
            }
        });
    } else {
        setupScreen.style.display = 'flex';
        chatScreen.style.display = 'none';
        businessSetupScreen.style.display = 'none';
    }
});

// --- EVENT LISTENER FOR SHOW ORIGINAL BUTTONS (Updated for trial) ---
messagesContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('show-original-button')) {
        const button = event.target;
        const originalText = button.getAttribute('data-original');
        const translatedParagraph = button.previousElementSibling;
        
        if (button.textContent === 'Show Original') {
            translatedParagraph.textContent = originalText;
            button.textContent = 'Show Original (Encrypted)';
        } else {
            // Revert back to the trial message display
            translatedParagraph.textContent = `[NO TRANSLATION - Spark Trial] ${originalText}`;
            button.textContent = 'Show Original';
        }
    }
});
