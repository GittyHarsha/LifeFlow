// background.js (Manifest V3 service worker)

// Example db snippet for storing data. If you have a separate db.js, import it if possible.
// For demonstration, we store data in a simple variable or do your actual IDB code here.
let gridData = { projects: ['main', 'health', 'project', 'finance'], cells: {} };
let tasksData = [];

// You might store the actual data in IDB here, or in memory for demonstration.
async function loadGrid() {
  return gridData; // or load from IDB
}
async function saveGrid(newData) {
  gridData = newData; // or save to IDB
}
async function loadTasks() {
  return tasksData; // or load from IDB
}
async function saveTasks(newTasks) {
  tasksData = newTasks; // or save to IDB
}

// OAuth config
const CLIENT_ID = '740864849778-p3prkjk1fu77sbkqi4umeqknf5opvfu4.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// We'll store the access token here in memory
let accessToken = null;

// Listen for messages from the popup (GoogleDriveSync.jsx)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.command === 'signIn') {
    handleSignIn().then(() => {
      sendResponse({ status: 'signedIn', accessToken });
    }).catch((err) => {
      sendResponse({ status: 'error', message: err.message });
    });
    return true; // Keep the message channel open for async response
  }
  if (msg.command === 'signOut') {
    handleSignOut();
    sendResponse({ status: 'signedOut' });
  }
  if (msg.command === 'export') {
    handleExport().then(() => {
      sendResponse({ status: 'exported' });
    }).catch((err) => {
      sendResponse({ status: 'error', message: err.message });
    });
    return true;
  }
  if (msg.command === 'import') {
    handleImport().then(() => {
      sendResponse({ status: 'imported' });
    }).catch((err) => {
      sendResponse({ status: 'error', message: err.message });
    });
    return true;
  }
});

// 1) Sign In using implicit grant with chrome.identity.launchWebAuthFlow
async function handleSignIn() {
  if (accessToken) {
    // Already signed in
    return;
  }
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;

  // Must be a valid domain in your Google Cloud Console's redirect URIs

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('prompt', 'consent');

  const launchParams = {
    url: authUrl.toString(),
    interactive: true
  };
  const redirectUrl = await new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(launchParams, (responseUrl) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError));
      }
      if (!responseUrl) {
        return reject(new Error('Empty responseUrl'));
      }
      resolve(responseUrl);
    });
  });

  // Extract access_token from the fragment (#)
  const fragment = redirectUrl.split('#')[1];
  if (!fragment) throw new Error('No fragment in redirect URL');
  const params = new URLSearchParams(fragment);
  accessToken = params.get('access_token');
  if (!accessToken) throw new Error('No access token in fragment');
  console.log('Signed in, token:', accessToken);
}

// 2) Sign Out (revoke token)
function handleSignOut() {
  if (accessToken) {
    const revokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`;
    fetch(revokeUrl).catch(() => {});
  }
  accessToken = null;
}

// 3) Export data: load from our "db", upload to Drive
async function handleExport() {
  if (!accessToken) throw new Error('Not signed in');
  // Load data from your "db"
  const grid = await loadGrid();
  const tasks = await loadTasks();
  const payload = { gridData: grid, tasksData: tasks };
  const json = JSON.stringify(payload, null, 2);

  // 3a) Simple upload to Drive as "lifeflow.json"
  // Step 1: Upload the file content
  let createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: json
  });
  if (!createRes.ok) {
    throw new Error(`Upload failed: ${createRes.statusText}`);
  }
  const createData = await createRes.json();
  const fileId = createData.id;
  // 3b) Rename the file
  let updateRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'lifeflow.json' })
  });
  if (!updateRes.ok) {
    throw new Error(`Rename failed: ${updateRes.statusText}`);
  }
  console.log('Export successful, fileId:', fileId);
}

// 4) Import data: search for "lifeflow.json", download, parse, save to "db"
async function handleImport() {
  if (!accessToken) throw new Error('Not signed in');
  // Step 1: Find the file
  let listRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=100&q=name%3D%27lifeflow.json%27+and+trashed%3Dfalse', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!listRes.ok) {
    throw new Error(`List failed: ${listRes.statusText}`);
  }
  let listData = await listRes.json();
  if (!listData.files || listData.files.length === 0) {
    throw new Error('No lifeflow.json found on Drive');
  }
  const fileId = listData.files[0].id;

  // Step 2: Download file content
  let downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!downloadRes.ok) {
    throw new Error(`Download failed: ${downloadRes.statusText}`);
  }
  let jsonText = await downloadRes.text();
  const data = JSON.parse(jsonText);
  // Step 3: Save to "db"
  if (data.gridData) await saveGrid(data.gridData);
  if (data.tasksData) await saveTasks(data.tasksData);
  console.log('Import successful');
}
