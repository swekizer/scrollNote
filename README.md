# scrollNote

A Chrome extension that allows you to capture text selections along with screenshots and save them with personal notes to a cloud database.

## Features

- 📝 Select any text on a webpage and save it instantly
- 📸 Automatically captures screenshots of the current page
- 🗒️ Add personal notes to your saved selections
- ☁️ Cloud storage with Supabase backend
- 🔐 User authentication and personal data management
- 🌐 Web interface to view all your saved snaps

## Project Structure

```
scrollNote/
├── extension/
│   ├── manifest.json          # Chrome extension manifest
│   ├── background.js          # Background service worker
│   ├── content.js            # Content script for text selection
│   ├── popup.html            # Extension popup interface
│   ├── popup.js              # Popup functionality
│   ├── styles.css            # Extension styling
│   └── supabase-config.js    # Supabase configuration
├── website/
│   ├── index.html            # Web app to view snaps
│   ├── script.js             # Web app functionality
│   ├── styles.css            # Web app styling
│   └── supabase-config.js    # Supabase configuration
└── README.md
```

## Prerequisites

- Google Chrome browser
- Supabase account (free tier available)
- Basic knowledge of Chrome extension installation

## Setup Instruction

Refer to setup.md.

## How to Use

### First Time Setup

1. **Sign Up**: Click the scrollNote extension icon in Chrome and create an account
2. **Sign In**: Use your credentials to sign in to the extension

### Capturing Snaps

1. **Select Text**: On any webpage, select the text you want to save
2. **Save Button**: A "Save" button will appear near your selection
3. **Click Save**: Click the button to start the capture process
4. **Add Note**: A popup will appear where you can add a personal note
5. **Save**: Click "Save" to store your snap in the cloud

### Viewing Your Snaps

1. Click the scrollNote extension icon
2. Click "View My Snaps" to open the web interface
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
- Backend (Node.js and Express.js)
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
