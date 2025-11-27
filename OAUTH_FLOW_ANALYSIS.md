# OAuth Flow Analysis: Google Search Console Error

## Problem Identified

The error shows: `redirect_uri=http://localhost:3000/api/google-search-console/callback` (OLD URI)

But the code now uses: `http://localhost:3000/api/gsc/callback` (NEW URI)

## Root Cause

The OAuth2Client is initialized **at module load time** with the redirect URI. If:
1. The server wasn't restarted after code changes
2. An environment variable `GOOGLE_SEARCH_CONSOLE_REDIRECT_URL` is set to the old value
3. The module was cached with the old value

Then the OAuth2Client will still use the old redirect URI.

## Comparison: GA4, Google Ads, and Search Console

### ✅ Google Analytics (Working)
- **Config**: `backend/src/config/google.ts`
- **Redirect URI**: `http://localhost:3000/api/google/callback`
- **Route**: `/api/google/auth` → `/api/google/callback`
- **OAuth2Client**: Initialized with `ENV.GOOGLE_REDIRECT_URL`
- **Status**: ✅ Working

### ✅ Google Ads (Working)
- **Config**: `backend/src/config/googleAds.ts`
- **Redirect URI**: `http://localhost:3000/api/google-ads/callback`
- **Route**: `/api/google-ads/auth` → `/api/google-ads/callback`
- **OAuth2Client**: Initialized with `ENV.GOOGLE_ADS_REDIRECT_URL`
- **Status**: ✅ Working

### ❌ Google Search Console (Error)
- **Config**: `backend/src/config/googleSearchConsole.ts`
- **Redirect URI (NEW)**: `http://localhost:3000/api/gsc/callback`
- **Redirect URI (OLD)**: `http://localhost:3000/api/google-search-console/callback` ← **This is what's being used**
- **Route**: `/api/gsc/auth` → `/api/gsc/callback`
- **OAuth2Client**: Initialized with `ENV.GOOGLE_SEARCH_CONSOLE_REDIRECT_URL`
- **Status**: ❌ Error - Using old redirect URI

## Solution Applied

1. **Added validation** to prevent using the old redirect URI
2. **Added explicit logging** to show which redirect URI is being used
3. **Added error throwing** if old URI is detected

## Action Required

### 1. Check Environment Variables
Check if `GOOGLE_SEARCH_CONSOLE_REDIRECT_URL` is set in:
- `.env` file in backend directory
- System environment variables
- Docker/container environment

If it's set to the old value, either:
- Remove it (to use the new default)
- Update it to: `http://localhost:3000/api/gsc/callback`

### 2. Restart Backend Server
The OAuth2Client is initialized at module load, so the server **MUST be restarted** for changes to take effect.

### 3. Add Redirect URI to Google Cloud Console
Add this exact URI to your Google Cloud Console:
```
http://localhost:3000/api/gsc/callback
```

## Verification

After restarting the server, check the logs. You should see:
```
[Google Search Console Config] Initializing OAuth2Client with redirect URI: http://localhost:3000/api/gsc/callback
[Google Search Console Config] Using redirect URI: http://localhost:3000/api/gsc/callback
[Google Search Console Config] Generated auth URL contains redirect_uri: http://localhost:3000/api/gsc/callback
```

If you see the old URI in the logs, the server hasn't been restarted or an environment variable is overriding it.


