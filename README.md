# scrollNote

scrollNote is a Chrome extension plus web dashboard for saving highlighted text, notes, and screenshots from webpages.

## Project Parts

- `extension/`: Chrome extension UI and capture flow
- `website/`: React + Vite dashboard for browsing saved notes
- `backend/`: Express API that talks to Supabase auth, database, and storage

## Local Development

### Backend

Create `backend/.env` from [backend/.env.example](C:/Users/sweki/Documents/Code/scrollNote/backend/.env.example), then start the API:

```bash
cd backend
npm install
npm run dev
```

### Website

Run the dashboard locally:

```bash
cd website
npm install
npm run dev
```

Default local website URL:

- `http://localhost:5173`

Default local backend API URL:

- `http://localhost:5000/api`

### Extension

Load `extension/` as an unpacked Chrome extension:

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the `extension` folder

## Deployment

The clean deployment flow is:

1. Deploy the backend
2. Deploy the website
3. Update the extension production URLs

See [DEPLOYMENT.md](C:/Users/sweki/Documents/Code/scrollNote/DEPLOYMENT.md) for the exact checklist.

## Supabase

You need:

- a `snaps` table
- a public storage bucket for screenshots
- policies for snaps and storage

See [setup.md](C:/Users/sweki/Documents/Code/scrollNote/setup.md) for the Supabase-specific SQL and bucket setup.

## Config Files

- Backend env template: [backend/.env.example](C:/Users/sweki/Documents/Code/scrollNote/backend/.env.example)
- Extension URLs: [extension/api-config.js](C:/Users/sweki/Documents/Code/scrollNote/extension/api-config.js)
- Website API config: [website/src/config.js](C:/Users/sweki/Documents/Code/scrollNote/website/src/config.js)

## Note

The extension popup settings panel is hidden by default because normal users should not need to edit raw API URLs.
