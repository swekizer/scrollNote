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

face
3. Browse all your saved snaps with screenshots and notes
