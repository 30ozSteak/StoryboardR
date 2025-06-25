#!/bin/bash

# Test connection to your Repl.it API  
echo "🔍 Testing connection to your Repl.it API..."
echo "============================================"

# Common Repl.it URL patterns for user imsteaky
POSSIBLE_URLS=(
  "https://storyboardr-api.imsteaky.repl.co"
  "https://storyboard-api.imsteaky.repl.co" 
  "https://keyframes-api.imsteaky.repl.co"
  "https://video-api.imsteaky.repl.co"
  "https://api.imsteaky.repl.co"
  "https://nodejs-server.imsteaky.repl.co"
  "https://express-server.imsteaky.repl.co"
)

echo "Trying common URL patterns..."
echo ""

for url in "${POSSIBLE_URLS[@]}"; do
  echo "Testing: $url"
  
  # Test health endpoint
  response=$(curl -s -w "%{http_code}" -o /tmp/response.txt "$url/health" 2>/dev/null || echo "000")
  
  if [ "$response" = "200" ]; then
    echo "✅ SUCCESS! Found your API at: $url"
    echo "📋 Health check response:"
    cat /tmp/response.txt | jq '.' 2>/dev/null || cat /tmp/response.txt
    echo ""
    echo "🔗 Your API Base URL: $url"
    echo ""
    
    # Test creating a storyboard
    echo "🧪 Testing storyboard creation..."
    curl -s -X POST "$url/api/storyboards" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test from Local",
        "description": "Testing connection from local frontend", 
        "keyframes": [
          {"filename": "frame1.jpg", "timestamp": 0, "index": 0},
          {"filename": "frame2.jpg", "timestamp": 5, "index": 1}
        ]
      }' | jq '.' 2>/dev/null
    echo ""
    break
  elif [ "$response" = "000" ]; then
    echo "❌ No response (URL doesn't exist)"
  else
    echo "❌ HTTP $response"
  fi
  echo ""
done
      {"filename": "test1.jpg", "timestamp": 0, "index": 0},
      {"filename": "test2.jpg", "timestamp": 5, "index": 1}
    ]
  }' | jq '.' 2>/dev/null || curl -s -X POST "$REPL_URL/api/storyboards" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test from Local",
    "description": "Testing connection from local frontend",
    "keyframes": [
      {"filename": "test1.jpg", "timestamp": 0, "index": 0},
      {"filename": "test2.jpg", "timestamp": 5, "index": 1}
    ]
  }'
echo ""

# Test 4: List all storyboards
echo "4. List All Storyboards:"
curl -s "$REPL_URL/api/storyboards" | jq '.' 2>/dev/null || curl -s "$REPL_URL/api/storyboards"
echo ""

echo "✅ API Connection Test Complete!"
echo ""
echo "💡 To use this API in your SPA:"
echo "1. Update REMOTE_API_URL in spa-integration.js to: $REPL_URL"
echo "2. Set USE_REMOTE_API: true"
echo "3. Your storyboards will now persist in the cloud!"
