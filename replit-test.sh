#!/bin/bash

# Simple API test script for Repl.it deployment
echo "🧪 Testing StoryboardR API"
echo "=========================="

# Check if API_URL is set, otherwise use localhost
API_URL=${API_URL:-"http://localhost:3000"}

echo "🔗 Testing API at: $API_URL"
echo ""

# Test health endpoint
echo "1. Health Check:"
curl -s "$API_URL/health" | jq '.' || echo "Health check failed"
echo ""

# Test root endpoint (API documentation)
echo "2. API Documentation:"
curl -s "$API_URL/" | jq '.endpoints' || echo "Root endpoint failed"
echo ""

# Test creating a storyboard
echo "3. Creating Test Storyboard:"
STORYBOARD_RESPONSE=$(curl -s -X POST "$API_URL/api/storyboards" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Storyboard",
    "description": "A test storyboard",
    "keyframes": [
      {"filename": "frame1.jpg", "timestamp": 0, "index": 0},
      {"filename": "frame2.jpg", "timestamp": 5, "index": 1}
    ]
  }')

echo "$STORYBOARD_RESPONSE" | jq '.'
STORYBOARD_ID=$(echo "$STORYBOARD_RESPONSE" | jq -r '.storyboard.id')
echo ""

# Test getting all storyboards
echo "4. Getting All Storyboards:"
curl -s "$API_URL/api/storyboards" | jq '.'
echo ""

# Test getting specific storyboard
if [ "$STORYBOARD_ID" != "null" ] && [ "$STORYBOARD_ID" != "" ]; then
  echo "5. Getting Specific Storyboard ($STORYBOARD_ID):"
  curl -s "$API_URL/api/storyboards/$STORYBOARD_ID" | jq '.'
  echo ""
fi

echo "✅ API Test Complete!"
