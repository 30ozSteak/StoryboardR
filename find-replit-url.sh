#!/bin/bash

echo "🔍 Finding Your Repl.it API URL"
echo "==============================="

# List of possible URLs for your API
URLS=(
  "https://storyboardr-api.imsteaky.repl.co"
  "https://storyboardr-api.imsteaky.replit.dev" 
  "https://StoryboardR-API.imsteaky.repl.co"
  "https://StoryboardR-API.imsteaky.replit.dev"
)

echo "Testing possible URLs..."
echo ""

for url in "${URLS[@]}"; do
  echo "🔗 Testing: $url"
  
  # Test with timeout
  response=$(curl -s --max-time 10 "$url/health" 2>/dev/null)
  
  if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "✅ SUCCESS! API found at: $url"
    echo "📋 Response: $response"
    echo ""
    echo "🎯 Use this URL in your spa-integration.js:"
    echo "REMOTE_API_URL: '$url'"
    echo ""
    
    # Test API endpoints
    echo "🧪 Testing API endpoints:"
    echo "1. Root endpoint:"
    curl -s "$url/" | head -10
    echo ""
    echo "2. Storyboards endpoint:"
    curl -s "$url/api/storyboards"
    echo ""
    
    exit 0
  else
    echo "❌ Not responding"
  fi
  echo ""
done

echo "🚨 No URLs responded. This means:"
echo "1. Your Repl.it might be sleeping (visit it in browser to wake it up)"
echo "2. The project name might be different"
echo "3. Your Repl.it might not be public"
echo ""
echo "💡 Next steps:"
echo "1. Go to your Repl.it and make sure it's running"
echo "2. Look for the 'Open in new tab' button to get the exact URL"
echo "3. Make sure your Repl.it is set to public (not private)"
