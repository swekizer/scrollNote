# scrollNote Backend

This is the backend server for the scrollNote application. It provides secure API endpoints for the website and Chrome extension to interact with Supabase.

## Features

- Secure authentication endpoints
- Snap data management
- File storage for screenshots
- Environment-based configuration
- CORS protection
- Rate limiting

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

3. Update the `.env` file with your Supabase credentials and other configuration.

## Development

Start the development server with hot reloading:

```
npm run dev
```

## Production

Start the production server:

```
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/signin` - Sign in a user
- `POST /api/auth/signup` - Register a new user

### Snaps

- `GET /api/snaps` - Get all snaps for a user
- `POST /api/snaps` - Create a new snap

### Storage

- `POST /api/storage/upload` - Upload a file to Supabase storage

## Deployment

This backend can be deployed to Render or any other Node.js hosting service.

### Render Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the build command to `npm install`
4. Set the start command to `npm start`
5. Add environment variables from your `.env` file

## Security

This backend implements several security measures:

- Environment variables for sensitive data
- Helmet for HTTP security headers
- Rate limiting to prevent abuse
- CORS configuration to restrict access