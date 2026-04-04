export class TwitchAuth extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addInteractions();
  }

  // API to update the code dynamically from your main script
  setCode(code) {
    const display = this.shadowRoot.getElementById('user-code');
    const loading = this.shadowRoot.getElementById('loading');
    const content = this.shadowRoot.getElementById('auth-content');

    if (display) {
      loading.style.display = 'none';
      content.style.display = 'block';
      display.textContent = code;
    }
  }

  // API to show/hide the popup
  setVisible(visible) {
    this.style.display = visible ? 'block' : 'none';
  }

  addInteractions() {
    const input = this.shadowRoot.getElementById('copyBox');

    // Copy to clipboard logic
    input.addEventListener('click', () => {
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        // Optional: Visual feedback
        const originalBg = input.style.background;
        input.style.background = '#4a237e'; // Flash purple
        setTimeout(() => input.style.background = originalBg, 200);
      });
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          font-family: 'Segoe UI', sans-serif;
          background: rgba(0, 0, 0, 0.9);
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          border: 2px solid #9146FF;
          width: 300px;
          margin: 20px auto;
          color: white;
          display: none; /* Hidden by default */
          box-sizing: border-box;
          position: sticky;
        }

        h3 { margin-top: 0; color: #9146FF; }

        .code-display {
          font-size: 2.2em;
          font-weight: bold;
          color: #00E5FF;
          margin: 15px 0;
          letter-spacing: 3px;
        }

        .instruction {
          margin-bottom: 10px;
          font-size: 0.9em;
          line-height: 1.6;
        }

        /* THE ONE LINE TEXTAREA / INPUT STYLE */
        input#copyBox {
          font-family: inherit;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #555;
          border-radius: 4px;
          color: #ddd;
          padding: 4px 8px;
          width: 190px;
          text-align: center;
          cursor: pointer;
          font-size: 0.9em;
          transition: all 0.2s;
          margin: 0 5px;
        }

        input#copyBox:hover {
          border-color: #9146FF;
          color: white;
        }

        input#copyBox:focus {
          outline: none;
          border-color: #00E5FF;
        }

        .status {
          font-size: 0.8em;
          color: #aaa;
          margin-top: 10px;
        }
      </style>

      <h3>Connection Required</h3>
      <div id="loading">Initializing...</div>
      
      <div id="auth-content" style="display:none;">
        <p class="instruction">
          Go to <br>
          <input type="text" value="https://www.twitch.tv/activate" id="copyBox" readonly title="Click to copy">
          <br>and enter this code:
        </p>
        <div class="code-display" id="user-code">????</div>
        <p class="status">Waiting for validation...</p>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('twitch-auth', TwitchAuth);


// --- CONFIGURATION ---
const CLIENT_ID = 'y137vl5dm6gtj8tcfliqkjebqwn125';
const SCOPES = 'chat:read channel:manage:clips';

// --- ENDPOINTS ---
const AUTH_BASE = 'https://id.twitch.tv/oauth2';
const VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';

const channel = new BroadcastChannel('reload_channel');
channel.onmessage = (event) => {
  if (event.data === 'reload') {
    console.log("Received reload message, reloading page...");
    location.reload();
  }
};

function reloadChatBoxs() {
  channel.postMessage('reload');
  setTimeout(() => location.reload(), 50);
}

// Helper for logging with timestamps
function log(msg) {
  const time = new Date().toISOString().split('T')[1].slice(0, -1);
  console.log(`[${time}] ${msg}`);
}

export async function startChat() {

  async function localTokenCheck() {
    const storedAccess = localStorage.getItem('access_token');
    if (!storedAccess) {
      log("No access token found during periodic check.");
      reloadChatBoxs();
    }
    let expires_in = await validateToken(storedAccess)

    if (expires_in < 10000) {
      log("expired token")
      const storedRefresh = localStorage.getItem('refresh_token');
      refreshAccessToken(storedRefresh)
    }
    else {
      log("Token still valid")
    }
  }
  await localTokenCheck() // Check immediately on start
  setInterval(localTokenCheck, 60000)
}

// --- OAUTH FUNCTIONS ---

async function validateToken(token) {
  try {
    log("   -> Sending Validate request to Twitch...");
    const res = await fetch(VALIDATE_URL, {
      headers: { 'Authorization': `OAuth ${token}` }
    });
    let json = await res.json()
    log(`   -> Twitch response received (Status: ${res.status})`);
    if (res.status === 200) {
      log(`   -> Twitch Token Expires In ${json.expires_in} seconds`);
      return json.expires_in
    }
    else
      return 0
  } catch (e) {
    console.error("Validation error:", e);
    return 0;
  }
}

async function refreshAccessToken(refreshToken) {
  try {
    log("   -> Sending Refresh request...");
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', CLIENT_ID);

    const res = await fetch(`${AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!res.ok) throw new Error('Refresh request failed');

    const data = await res.json();
    saveTokens(data.access_token, data.refresh_token);
    return data;
  } catch (e) {
    console.error(e);
    deleteTokens();
    reloadChatBoxs();
    return null;
  }
}

export async function startDeviceFlow() {
//  const loginUI = document.getElementById('myLogin');
  let loginUI = document.createElement("twitch-auth")
  document.body.append(loginUI)

  loginUI.setVisible(true);

  try {
    // 1. Request Code
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('scopes', SCOPES);

    const res = await fetch(`${AUTH_BASE}/device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!res.ok) throw new Error("Could not init device flow (CORS?)");

    const data = await res.json();

    loginUI.setCode(data.user_code);

    // 2. Poll for validation
    let interval = setInterval(async () => {
      const pollParams = new URLSearchParams();
      pollParams.append('client_id', CLIENT_ID);
      pollParams.append('scopes', SCOPES);
      pollParams.append('device_code', data.device_code);
      pollParams.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');

      const pollRes = await fetch(`${AUTH_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: pollParams
      });

      const pollData = await pollRes.json();

      if (pollRes.ok && pollData.access_token) {
        clearInterval(interval);
        saveTokens(pollData.access_token, pollData.refresh_token);
        loginUI.setVisible(false);
        startChat(pollData.access_token);
        reloadChatBoxs();
      } else if (pollData.message === 'expired_token') {
        clearInterval(interval);
        alert("Code expired. Please reload the page.");
      }
    }, data.interval * 1000);

  } catch (e) {
    console.error(e);
    document.getElementById('loading').innerText = "Error: " + e.message;
  }
}

export function saveTokens(access, refresh) {
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh); // Important !
  log("   -> New tokens saved to LocalStorage.");
}

export function getToken() {
  return localStorage.getItem('access_token')
}

function deleteTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  log("   -> Tokens deleted from LocalStorage.");
}

// --- MAIN LOGIC ---
async function main() {
  log("1. Script started");
  const storedAccess = localStorage.getItem('access_token');
  const storedRefresh = localStorage.getItem('refresh_token');

  if (storedAccess && storedRefresh) {
    log("2. Tokens found in storage. Validating...");
    const isValid = await validateToken(storedAccess);
    log(`3. Validation result: ${isValid}`);

    if (isValid) {
      log("4. Token valid. Starting chat...");
      startChat(storedAccess);
      log("5. Chat started successfully.");
    } else {
      log("4. Token invalid/expired. Attempting refresh...");
      const newTokens = await refreshAccessToken(storedRefresh);
      if (newTokens) {
        log("5. Refresh successful. Starting chat...");
        startChat(newTokens.access_token);
      } else {
        log("5. Refresh failed. Restarting Device Flow from scratch.");
        startDevniceFlow();
      }
    }
  } else {
    log("2. No tokens found. Starting Device Flow.");
    startDeviceFlow();
  }
};