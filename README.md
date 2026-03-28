# scrollNote

A Chrome extension that allows you to capture text selections along with screenshots and save them with personal notes to a cloud database.

## Features

- 📝 Select any text on a webpage and save it instantly
- 📸 Automatically captures screenshots of the current page
- 🗒️ Add personal notes to your saved selections
- ☁️ Cloud storage with Supabase backend
- 🔐 User authentication and personal data management
- 🌐 Web interface to view all your saved snaps
- 🔒 Secure backend architecture with protected API keys

## Project Architecture

The project consists of three main components:

1. **Chrome Extension**: Captures text selections and screenshots from web pages
2. **Website**: Displays saved snaps and manages user authentication
3. **Backend**: Securely handles API requests to Supabase for data storage and authentication

### Security Improvements

The original implementation had Supabase credentials exposed in the frontend code. The new architecture moves all Supabase interactions to a secure backend server, protecting the API keys and providing a more robust security model.

## Project Structure

```
scrollNote/
├── extension/
│   ├── manifest.json          # Chrome extension manifest
│   ├── background.js          # Background service worker
│   ├── content.js             # Content script for text selection
│   ├── popup.html             # Extension popup interface
│   ├── popup.js               # Popup functionality
│   ├── styles.css             # Extension styling
│   └── api-config.js          # Backend API configuration
├── website/
│   ├── index.html             # Web app to view snaps
│   ├── script.js              # Web app functionality
│   ├── styles.css             # Web app styling
│   ├── api-config.js          # Backend API configuration
│   └── vercel.json            # Vercel deployment configuration
├── backend/
│   ├── server.js              # Main server file
│   ├── routes/                # API route handlers
│   ├── services/              # Service layer for external APIs
│   ├── middleware/            # Express middleware
│   ├── .env.example           # Environment variables template
│   └── render.yaml            # Render deployment configuration
└── README.md
```

## Prerequisites

- Google Chrome browser
- Supabase account (free tier available)
- Node.js and npm installed
- Basic knowledge of Chrome extension installation

## Setup and Development

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Supabase credentials.

4. Start the development server:
   ```
   npm run dev
   ```

### Website

1. In `website/api-config.js`, set `SCROLLNOTE_ENV` to `'development'` for local or `'production'` for deploy.

2. Set the matching `apiUrl` value in the same file.

3. Serve the website using a local server:
   ```
   npx serve website
   ```

### Extension

1. In `extension/api-config.js`, use the same `SCROLLNOTE_ENV` value as the website.

2. Set matching `apiUrl` and `websiteUrl` values for that environment.

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

## Deployment

### Backend (Render)

1. Create a new Web Service on Render.
2. Connect your GitHub repository.
3. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables from your `.env` file

### Website (Vercel)

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```
   cd website
   vercel
   ```

3. Update the `api-config.js` file with your production backend URL.

### Extension (Chrome Web Store)

1. Update the `api-config.js` file with your production backend URL.

2. Create a ZIP file of the extension directory.

3. Upload to the Chrome Web Store Developer Dashboard.

## How to Use

### First Time Setup

1. **Sign Up**: Click the scrollNote extension icon in Chrome and create an account. You will receive a email verification email on your email id from supabase.
2. **Sign In**: Use your credentials to sign in to the extension

### Capturing Snaps

1. **Select Text**: On any webpage, select the text you want to save
2. **Save Button**: A "Save" button will appear near your selection
3. **Click Save**: Click the button to start the capture process
4. **Add Note**: A popup will appear where you can add a personal note
5. **Save**: Click "Save" to store your snap in the cloud

### Viewing Your Snaps

1. Click the scrollNote extension icon
2. Click "View My Notes" to open the web interface
3. Browse all your saved snaps with screenshots and notes

## Known Issues and Solutions

### Issue 1: Need to Sign In Every Time Browser Opens

**Problem**: Extension doesn't remember login state after browser restart.

**Current Workaround**: 
- Sign in each time you open the browser
- The extension uses `chrome.storage.local` which should persist, but may need debugging

### Issue 2: Need to Click Extension Icon for Screenshot Permission

**Problem**: Chrome requires explicit permission for screenshot capture everytime you try to save your note.

**Current Workaround**: 
- Click the extension icon once per browser session to grant screenshot permission
- This activates the `activeTab` permission needed for screenshots

## Key Technlogies

- Chrome Extensions API (Manifest V3)
- Supabase (Database + Authentication + Storage)
- Frontend (HTML + CSS + Vanilla JavaScript)

## Troubleshooting

### Extension Not Working
1. Check if the extension is enabled in `chrome://extensions/`
2. Verify Supabase configuration is correct
3. Check browser console for error messages

### Screenshots Not Saving
1. Click the extension icon to activate permissions
2. Verify the storage bucket is public in Supabase
3. Check network connectivity

### Authentication Issues
1. Verify Supabase project is active
2. Check if email confirmation is required
3. Ensure RLS policies are correctly set up

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with the Chrome extension
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review browser console errors
3. Verify Supabase dashboard for backend issues
4. [swekit0000@gmail.com]

---

**Note**: This extension requires internet connectivity to save snaps to the cloud. Screenshots and notes are stored securely in your personal Supabase database.
