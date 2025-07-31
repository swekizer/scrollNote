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

## Setup Instructions

### 1. Clone or Download the Project

```bash
git clone <your-repo-url>
cd scrollNote
```

### 2. Set Up Supabase Backend

#### Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a free account
2. Create a new project
3. Wait for the project to be fully set up

#### Create the Database Table
1. In your Supabase dashboard, go to the SQL Editor
2. Run this SQL command to create the required table:

```sql
CREATE TABLE snaps (
  id SERIAL PRIMARY KEY,
  text TEXT,
  url TEXT,
  title TEXT,
  h1 TEXT,
  position JSONB,
  timestamp TIMESTAMPTZ,
  note TEXT,
  screenshot TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Create Storage Bucket for Screenshots
1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `screenshots`
3. Make the bucket public by going to bucket settings and enabling "Public bucket"

#### Set Up Row Level Security (RLS)
1. In the SQL Editor, run these commands to set up proper security:

```sql
-- Enable RLS on the snaps table
ALTER TABLE snaps ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own snaps
CREATE POLICY "Users can view own snaps" ON snaps
    FOR SELECT USING (auth.email() = user_email);

-- Policy to allow users to insert their own snaps
CREATE POLICY "Users can insert own snaps" ON snaps
    FOR INSERT WITH CHECK (auth.email() = user_email);

-- Policy to allow users to update their own snaps
CREATE POLICY "Users can update own snaps" ON snaps
    FOR UPDATE USING (auth.email() = user_email);

-- Policy to allow users to delete their own snaps
CREATE POLICY "Users can delete own snaps" ON snaps
    FOR DELETE USING (auth.email() = user_email);
```

#### Configure Storage Policies
1. Go to Storage → Policies in your Supabase dashboard
2. Create these policies for the `screenshots` bucket:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'screenshots' 
        AND auth.email()::text = (storage.foldername(name))[1]
    );

-- Allow public read access to screenshots
CREATE POLICY "Public can view screenshots" ON storage.objects
    FOR SELECT USING (bucket_id = 'screenshots');
```

### 3. Configure the Project

#### Update Supabase Configuration
1. In your Supabase dashboard, go to Settings → API
2. Copy your Project URL and anon public key
3. Update both `extension/supabase-config.js` and `website/supabase-config.js`:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 4. Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `extension` folder from your project
5. The scrollNote extension should now appear in your extensions list

### 5. Set Up the Web Interface (Optional)

If you want to run the web interface locally:

1. Start a local web server in the `website` directory:
   ```bash
   cd website
   python -m http.server 3000
   # or use any other local server
   ```
2. The web interface will be available at `http://localhost:3000`

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

**Permanent Solution**: 
- Implement token refresh mechanism
- Add better error handling for expired tokens
- Store authentication state more reliably

### Issue 2: Need to Click Extension Icon for Screenshot Permission

**Problem**: Chrome requires explicit permission for screenshot capture on each browser session.

**Current Workaround**: 
- Click the extension icon once per browser session to grant screenshot permission
- This activates the `activeTab` permission needed for screenshots

**Permanent Solution**: 
- Request `tabs` permission instead of `activeTab` (requires user approval for broader permissions)
- Or implement a one-time setup flow that clearly explains the permission requirements

### Recommended Fixes

To improve the user experience, consider implementing these fixes:

1. **Persistent Authentication**:
   ```javascript
   // Add token refresh logic to background.js
   // Check token validity on extension startup
   // Implement automatic re-authentication
   ```

2. **Better Permission Handling**:
   ```javascript
   // Add permission check and request flow
   // Show user-friendly messages about required permissions
   // Implement fallback for when screenshots fail
   ```

3. **Enhanced Error Handling**:
   ```javascript
   // Better error messages for users
   // Retry mechanisms for failed operations
   // Offline support with sync when online
   ```

## Development

### File Structure Explanation

- **manifest.json**: Defines extension permissions and structure
- **background.js**: Handles screenshot capture and Supabase communication
- **content.js**: Manages text selection and UI on web pages
- **popup.js/html**: Extension popup for authentication
- **website/**: Standalone web app to view saved snaps

### Key Technologies

- Chrome Extensions API (Manifest V3)
- Supabase (Database + Authentication + Storage)
- Vanilla JavaScript (No frameworks)
- CSS Grid for responsive layout

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

## License

[Add your license here]

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review browser console errors
3. Verify Supabase dashboard for backend issues
4. [Add your contact information or issue tracker]

---

**Note**: This extension requires internet connectivity to save snaps to the cloud. Screenshots and notes are stored securely in your personal Supabase database.
