// server/utils/tokenStore.js
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '..', '.data', 'linkedin_token.json');

// Load token from file
function load() {
  try {
    const txt = fs.readFileSync(TOKEN_FILE, 'utf8');
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

// Save token to file
function save(tokenObj) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenObj, null, 2));
}

// Get token if it's still valid
function getAccessToken() {
  const t = load();
  if (!t) return null;
  if (t.expires_at && Date.now() >= t.expires_at) return null;
  return t.access_token || null;
}

module.exports = { load, save, getAccessToken };
