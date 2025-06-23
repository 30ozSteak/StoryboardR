# Video Keyframes Extractor - Quick Start Examples

## Test the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Process Video from URL
```bash
curl -X POST http://localhost:3000/api/video/process-url \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"}'
```

Expected response:
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

### 3. Upload Video File
```bash
curl -X POST http://localhost:3000/api/upload/file \
  -F "video=@/path/to/your/video.mp4"
```

### 4. Get Keyframes as Base64
```bash
curl http://localhost:3000/api/video/keyframes/SESSION_ID/base64
```

### 5. Access Individual Keyframe
```bash
curl http://localhost:3000/keyframes/SESSION_ID/keyframe_0001.jpg -o keyframe.jpg
```

### 6. Clean Up Session
```bash
curl -X DELETE http://localhost:3000/api/video/session/SESSION_ID
```

## Testing with Real Videos

You can test with any direct MP4 URL. Here are some sample video URLs you can use for testing:

1. **Small test video**: `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`
2. **Larger test video**: `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4`

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid input, file too large, etc.)
- `404` - Resource not found
- `500` - Server error (FFmpeg issues, file system errors, etc.)

## Next Steps

1. **Frontend Integration**: Build a web interface to interact with these endpoints
2. **Customize Extraction**: Modify extraction parameters in `src/keyframeExtractor.js`
3. **Production Deploy**: Set up environment variables and deploy to your preferred platform
4. **Add Authentication**: Implement API keys or authentication as needed
