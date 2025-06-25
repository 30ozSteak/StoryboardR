# StoryboardR API

Lightweight Node.js API for StoryboardR data persistence.

## Quick Setup on Repl.it

1. **Create a new Node.js repl** on replit.com
2. **Copy these files** to your repl:
   - `package.json` (from replit-package.json)
   - `server.js` (from replit-server.js)
   - `test.sh` (from replit-test.sh) - optional

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run the server**:
   ```bash
   npm start
   ```

5. **Test the API**:
   - Visit your repl's URL to see API documentation
   - Visit `/health` for health check
   - Use the endpoints below for data operations

## API Endpoints

### Storyboards
- `POST /api/storyboards` - Create a new storyboard
- `GET /api/storyboards` - List all storyboards
- `GET /api/storyboards/:id` - Get specific storyboard
- `PUT /api/storyboards/:id` - Update a storyboard
- `DELETE /api/storyboards/:id` - Delete a storyboard

### Extractions
- `POST /api/extractions` - Save an extraction for later
- `GET /api/extractions` - List all extractions
- `GET /api/extractions/:id` - Get specific extraction
- `DELETE /api/extractions/:id` - Delete an extraction

## Example Usage

### Create a Storyboard
```javascript
const response = await fetch('YOUR_REPL_URL/api/storyboards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Storyboard',
    description: 'A cool video storyboard',
    keyframes: [
      { filename: 'frame1.jpg', timestamp: 0, index: 0 },
      { filename: 'frame2.jpg', timestamp: 5, index: 1 }
    ],
    videoSource: 'https://example.com/video.mp4'
  })
});
```

### Save an Extraction
```javascript
const response = await fetch('YOUR_REPL_URL/api/extractions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoUrl: 'https://example.com/video.mp4',
    keyframes: [...],
    settings: { interval: 1, quality: 'medium' }
  })
});
```

## Integration with Frontend

Update your frontend's spa-integration.js to use your Repl.it URL:

```javascript
// Replace localhost with your Repl.it URL
const API_BASE_URL = 'https://your-repl-name.username.repl.co';

// Example API call
const response = await fetch(`${API_BASE_URL}/api/storyboards`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(storyboardData)
});
```

## Data Storage

- Data is stored in JSON files (`data/storyboards.json` and `data/extractions.json`)
- Files are automatically created when the server starts
- Data persists between server restarts on Repl.it

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (local development)
- Your frontend domain (update in server.js)

To add your frontend domain, edit the CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
  credentials: true
}));
```
