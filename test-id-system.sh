#!/bin/bash
# Test script to verify ID-based keyframe system

echo "Testing ID-based keyframe system..."

# Test video processing with URL
echo "1. Testing video processing with unique ID generation..."

# Test the API directly
curl -X POST http://localhost:3000/api/video/process \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "options": {
      "maxFrames": 5
    }
  }' | jq '.'

echo -e "\n2. Test completed. Check that keyframes have unique IDs in the response."

echo -e "\n3. Next steps:"
echo "   - Extract keyframes from a video"
echo "   - Verify each keyframe has a unique 'id' field"
echo "   - Test drag-and-drop reordering using IDs"
echo "   - Test selection/bulk operations using IDs"
echo "   - Test scrubbing creates new keyframes with IDs"
