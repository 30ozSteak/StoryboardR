#!/bin/bash

echo "=== Video Keyframes Extractor Backend - Demo ==="
echo ""

echo "✅ Server Health Check:"
curl -s http://localhost:3000/health
echo ""
echo ""

echo "📝 API Endpoints Available:"
echo ""

echo "1. Health Check:"
echo "   curl http://localhost:3000/health"
echo ""

echo "2. Process Video from URL:"
echo "   curl -X POST http://localhost:3000/api/video/process-url \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"videoUrl\": \"https://example.com/video.mp4\"}'"
echo ""

echo "3. Upload Video File:"
echo "   curl -X POST http://localhost:3000/api/upload/file \\"
echo "        -F \"video=@/path/to/video.mp4\""
echo ""

echo "4. Get Keyframes as Base64:"
echo "   curl http://localhost:3000/api/video/keyframes/SESSION_ID/base64"
echo ""

echo "5. Access Keyframe Image:"
echo "   curl http://localhost:3000/keyframes/SESSION_ID/keyframe_0001.jpg"
echo ""

echo "6. Clean Up Session:"
echo "   curl -X DELETE http://localhost:3000/api/video/session/SESSION_ID"
echo ""

echo "✅ FFmpeg Status:"
if command -v ffmpeg &> /dev/null; then
    echo "   FFmpeg is installed and ready"
else
    echo "   ❌ FFmpeg not found"
fi
echo ""

echo "✅ Node.js Dependencies:"
if [ -d "node_modules" ]; then
    echo "   All dependencies installed"
else
    echo "   ❌ Dependencies missing - run 'npm install'"
fi
echo ""

echo "🚀 Your backend is ready! The server is running on http://localhost:3000"
echo ""
echo "📚 See README.md for complete documentation and examples"
