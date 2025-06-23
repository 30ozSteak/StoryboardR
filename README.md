# Video Keyframes Extractor - Backend

A Node.js backend service for extracting keyframes from videos using FFmpeg. This service can process videos from URLs or uploaded files and extract I-frames (keyframes) as JPEG images.

## Prerequisites

Before running this application, make sure you have the following installed:

1. **Node.js** (v14 or higher)
2. **FFmpeg** - Required for video processing

### Installing FFmpeg

#### macOS (using Homebrew)
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html) and add to PATH.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Verify FFmpeg installation:
```bash
ffmpeg -version
```

## Usage

### Start the server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

### API Endpoints

#### 1. Health Check
```
GET /health
```
Returns server status.

#### 2. Process Video from URL
```
POST /api/video/process-url
Content-Type: application/json

{
  "videoUrl": "https://example.com/video.mp4"
}
```

**Response:**
```json
{
  "sessionId": "uuid-string",
  "keyframes": [
    {
      "filename": "keyframe_0001.jpg",
      "url": "/keyframes/session-id/keyframe_0001.jpg"
    }
  ],
  "totalFrames": 10
}
```

#### 3. Upload and Process Video File
```
POST /api/upload/file
Content-Type: multipart/form-data

Form data:
- video: [video file]
```

**Response:**
```json
{
  "sessionId": "uuid-string",
  "originalFilename": "example.mp4",
  "keyframes": [
    {
      "filename": "keyframe_0001.jpg",
      "url": "/keyframes/session-id/keyframe_0001.jpg"
    }
  ],
  "totalFrames": 10
}
```

#### 4. Get Keyframes as Base64
```
GET /api/video/keyframes/:sessionId/base64
```

**Response:**
```json
{
  "sessionId": "uuid-string",
  "keyframes": [
    {
      "filename": "keyframe_0001.jpg",
      "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD..."
    }
  ],
  "totalFrames": 10
}
```

#### 5. Clean Up Session
```
DELETE /api/video/session/:sessionId
```

#### 6. Access Keyframe Images
```
GET /keyframes/:sessionId/:filename
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)

### Keyframe Extraction Options

The keyframe extractor supports several options:

- `format`: Output format (default: 'jpg')
- `quality`: JPEG quality 1-31, lower is better (default: 2)
- `maxFrames`: Maximum number of keyframes (default: 50)
- `minInterval`: Minimum seconds between keyframes (default: 1)

## File Structure

```
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── src/
│   ├── videoProcessor.js     # Main video processing routes
│   ├── videoDownloader.js    # Video download functionality
│   ├── keyframeExtractor.js  # FFmpeg keyframe extraction
│   └── fileUpload.js         # File upload handling
└── temp/                     # Temporary files (auto-created)
    ├── uploads/              # Uploaded videos
    └── keyframes/            # Extracted keyframes
        └── [sessionId]/      # Session-specific keyframes
```

## Features

- ✅ Download videos from direct URLs
- ✅ Upload video files (up to 100MB)
- ✅ Extract true I-frames (keyframes) using FFmpeg
- ✅ Serve keyframes as static files or base64 strings
- ✅ Session-based file management
- ✅ Automatic cleanup of temporary files
- ✅ Progress tracking for downloads and extractions
- ✅ Error handling and validation
- ✅ CORS support for frontend integration

## Supported Video Formats

- MP4
- AVI
- MOV
- WMV
- FLV
- WebM
- MKV

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad request (invalid input, file too large, etc.)
- `404` - Resource not found (session, video URL, etc.)
- `500` - Server error (FFmpeg issues, file system errors, etc.)

## Development

### Adding New Features

1. **Custom Extraction Options**: Modify `keyframeExtractor.js` to add new FFmpeg options
2. **Additional Video Sources**: Extend `videoDownloader.js` to support more video platforms
3. **Different Output Formats**: Update the extractor to support PNG, WebP, etc.

### Testing

Test the API endpoints using curl or Postman:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test video URL processing
curl -X POST http://localhost:3000/api/video/process-url \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://example.com/sample.mp4"}'

# Test file upload
curl -X POST http://localhost:3000/api/upload/file \
  -F "video=@/path/to/video.mp4"
```

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed and available in PATH
2. **Permission errors**: Check file system permissions for temp directories
3. **Large file timeouts**: Increase timeout values for very large videos
4. **Memory issues**: Monitor memory usage for high-resolution videos

### Logs

The application logs important events to the console:
- Download progress
- Extraction progress
- Error messages
- File cleanup operations
