# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for your Contactium app.

## Prerequisites

- A Supabase project
- A Google Cloud Console account
- Your Contactium app running

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### 1.2 Enable Google+ API

1. In the left sidebar, click **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### 1.3 Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** (for public apps) or **"Internal"** (for organization only)
3. Click **"Create"**

4. Fill in the required information:
   - **App name**: Contactium
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - **App logo**: (optional) Upload your app logo
   - **Application home page**: Your app URL (e.g., `http://localhost:5173` for development)
   - **Authorized domains**: Add your domain (for production)

5. Click **"Save and Continue"**

6. **Scopes**: Click **"Add or Remove Scopes"**
   - Add the following scopes:
     - `userinfo.email`
     - `userinfo.profile`
   - Click **"Update"**
   - Click **"Save and Continue"**

7. **Test users** (if External):
   - Add your email and any test users
   - Click **"Save and Continue"**

8. Review and click **"Back to Dashboard"**

### 1.4 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ Create Credentials"** > **"OAuth client ID"**
3. Choose **"Web application"**
4. Fill in the information:

   **Name**: `Contactium Web Client`

   **Authorized JavaScript origins**:
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`

   **Authorized redirect URIs**:
   - Get this from Supabase (see Step 2 below)
   - It will look like: `https://your-project-ref.supabase.co/auth/v1/callback`

5. Click **"Create"**

6. **Copy your credentials**:
   - **Client ID** (looks like: `xxx.apps.googleusercontent.com`)
   - **Client Secret** (random string)
   - Keep these safe - you'll need them for Supabase

---

## Step 2: Configure Supabase

### 2.1 Get Supabase Callback URL

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Contactium project
3. Go to **"Authentication"** > **"Providers"**
4. Find **"Google"** in the list
5. Copy the **Callback URL (for OAuth)** - it looks like:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

### 2.2 Add Callback URL to Google Cloud Console

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** > **"Credentials"**
3. Click on your OAuth 2.0 Client ID
4. Under **"Authorized redirect URIs"**, click **"+ Add URI"**
5. Paste the Supabase callback URL you copied
6. Click **"Save"**

### 2.3 Enable Google Provider in Supabase

1. Back in Supabase Dashboard
2. Go to **"Authentication"** > **"Providers"**
3. Find and click on **"Google"**
4. Toggle **"Enable Sign in with Google"** to **ON**
5. Enter your Google OAuth credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
6. Click **"Save"**

---

## Step 3: Test Google OAuth

### 3.1 Test in Development

1. Make sure your app is running:
   ```bash
   npm run dev:all
   ```
   Or separately:
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   npm run server
   ```

2. Navigate to http://localhost:5173
3. You should see the **"Continue with Google"** button
4. Click it and sign in with your Google account
5. You should be redirected back to the app and logged in

### 3.2 Verify User in Supabase

1. Go to Supabase Dashboard
2. Navigate to **"Authentication"** > **"Users"**
3. You should see your Google account listed with:
   - Provider: `google`
   - Email from your Google account

---

## Step 4: Production Deployment

When deploying to production:

### 4.1 Update Google Cloud Console

1. Add your production domain to **Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   ```

2. The redirect URI should already work with your Supabase URL

### 4.2 Update OAuth Consent Screen

1. Go to **"OAuth consent screen"**
2. Click **"Publish App"** to make it available to all Google users
3. Google may review your app before publishing (this can take a few days)

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
- Double-check the redirect URI in Google Cloud Console matches exactly with the Supabase callback URL
- Make sure there are no trailing slashes or typos
- Wait a few minutes after updating - changes can take time to propagate

### "Access Blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured properly.

**Solution**:
- Make sure you've completed the OAuth consent screen setup
- Add test users if using "External" with unverified app
- Verify all required scopes are added

### Google Sign-In Button Not Working

**Problem**: Button doesn't respond or shows error.

**Solution**:
- Check browser console for errors
- Verify Supabase provider is enabled
- Make sure Client ID and Secret are correct in Supabase
- Check that you're using the correct project in Google Cloud Console

### User Not Created After Sign-In

**Problem**: Successfully signs in with Google but user isn't logged in.

**Solution**:
- Check Supabase logs in Dashboard > Logs
- Verify email confirmation is not required for OAuth (Settings > Authentication)
- Make sure redirect URL is correct

### Development vs Production Issues

**Problem**: Works in development but not in production.

**Solution**:
- Add production URLs to authorized origins and redirect URIs
- Update environment variables for production
- Publish the OAuth consent screen

---

## Security Best Practices

1. **Never commit credentials**: Keep your Google Client Secret secure
2. **Use environment variables**: Store sensitive data in `.env.local`
3. **Limit scopes**: Only request the minimum scopes needed (email, profile)
4. **Verify domain ownership**: Add domain verification in Google Cloud Console for production
5. **Monitor OAuth usage**: Check Google Cloud Console for unusual activity
6. **Keep Supabase updated**: Regularly update Supabase client library

---

## Additional Features

### Automatic Profile Information

When users sign in with Google, the following information is automatically available:

```javascript
const { data: { user } } = await supabase.auth.getUser()

console.log(user.email)           // Google email
console.log(user.user_metadata)   // Includes:
// - full_name
// - avatar_url
// - email_verified
```

### Customize Sign-In Flow

You can customize the OAuth flow with additional options:

```javascript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`,
    queryParams: {
      access_type: 'offline',  // Get refresh token
      prompt: 'consent',       // Force consent screen
    },
    scopes: 'email profile'     // Specify scopes
  }
})
```

---

## Support

If you encounter issues:

1. **Check Supabase logs**: Dashboard > Logs > Auth logs
2. **Check browser console**: Look for JavaScript errors
3. **Google Cloud Console**: Check credentials and API usage
4. **Supabase Discord**: [Join the community](https://discord.supabase.com)
5. **Google OAuth Documentation**: [Official docs](https://developers.google.com/identity/protocols/oauth2)

---

## Quick Reference

**Google Cloud Console**: https://console.cloud.google.com/

**Supabase Dashboard**: https://supabase.com/dashboard

**OAuth 2.0 Playground** (for testing): https://developers.google.com/oauthplayground/

**Supabase Callback URL Format**:
```
https://[PROJECT_REF].supabase.co/auth/v1/callback
```

**Required Google Scopes**:
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
