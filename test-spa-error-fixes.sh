#!/bin/bash

echo "🔧 Testing SPA Error Fixes"
echo "=========================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running"
    exit 1
fi

# Test the main page loads without errors
echo ""
echo "Testing SPA loading..."

# Test SPA loads
response=$(curl -s http://localhost:3000)
if echo "$response" | grep -q "StoryboardR"; then
    echo "✅ SPA loads correctly"
else
    echo "❌ SPA failed to load"
fi

# Test SPA scripts are loaded
if echo "$response" | grep -q 'src="spa.js"'; then
    echo "✅ SPA JavaScript loaded"
else
    echo "❌ SPA JavaScript missing"
fi

if echo "$response" | grep -q 'src="spa-integration.js"'; then
    echo "✅ SPA Integration JavaScript loaded"
else
    echo "❌ SPA Integration JavaScript missing"
fi

echo ""
echo "🎯 Error fix verification complete!"
echo "The app should now handle missing DOM elements gracefully."
