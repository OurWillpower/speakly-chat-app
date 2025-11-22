// ==============================================================
// STEP 4: CONTROLLING THE USER INTERFACE (UI)
// ==============================================================

// 1. Get references to the key HTML elements we need to control
const setupScreen = document.getElementById('setup-screen');
const chatScreen = document.getElementById('chat-screen');
const startButton = document.getElementById('start-chat-button');
const myLanguageInput = document.getElementById('my-language');
const userTypeSelect = document.getElementById('user-type');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const logoutButton = document.getElementById('logout-button');
const displayMyLang = document.getElementById('display-my-lang');

/**
 * Handles the logic when the 'Start Secure Chat' button is clicked.
 */
function handleStartChat() {
    // 1. Get the values the user selected/typed
    const userType = userTypeSelect.value;
    const myLanguage = myLanguageInput.value.trim();

    // 2. Simple validation to ensure fields are filled
    if (!userType || !myLanguage) {
        alert("Please select an Account Type and enter your Language.");
        return; // Stop the function if validation fails
    }

    // 3. Save the critical user info (we'll expand this later with Firebase)
    localStorage.setItem('userType', userType);
    localStorage.setItem('myLanguage', myLanguage);
    
    // 4. Update the display elements in the Chat Screen header
    displayMyLang.textContent = myLanguage;
    
    // 5. Hide the setup screen and show the chat screen (The actual UI switch)
    setupScreen.style.display = 'none';
    chatScreen.style.display = 'flex'; // Use 'flex' because we styled it as a flex column

    // 6. Enable the chat input fields
    chatInput.disabled = false;
    sendButton.disabled = false;

    // Optional: Log what happened in the browser console for debugging
    console.log(`Chat started for ${userType} user speaking ${myLanguage}`);
    
    // Alert the user about the next step in the chat flow
    alert(`Welcome, ${myLanguage} speaker! Your language is set. Now you can find a contact to chat with.`);
}

/**
 * Handles the logic for logging out (swapping back to the setup screen).
 */
function handleLogout() {
    // Clear the saved information
    localStorage.removeItem('userType');
    localStorage.removeItem('myLanguage');
    
    // Hide chat screen and show setup screen
    chatScreen.style.display = 'none';
    setupScreen.style.display = 'flex'; // Use 'flex' because we styled it as a flex column

    // Reset inputs for next use
    userTypeSelect.value = '';
    myLanguageInput.value = '';
    chatInput.disabled = true;
    sendButton.disabled = true;
}


// ==============================================================
// 2. ATTACH EVENT LISTENERS (Making the buttons do something)
// ==============================================================

// When the Start button is clicked, run the handleStartChat function
startButton.addEventListener('click', handleStartChat);

// When the Logout button is clicked, run the handleLogout function
logoutButton.addEventListener('click', handleLogout);
