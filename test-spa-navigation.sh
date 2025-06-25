#!/bin/bash

echo "🧪 Testing SPA Navigation - NO PAGE RELOADS ALLOWED"
echo "================================================="

# Test that all routes serve the SPA
echo "Testing that all routes serve the SPA (app.html)..."

# Test root route
echo "✅ Testing root route (/)..."
response1=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/)
if [ "$response1" = "200" ]; then
    echo "   ✅ Root route returns 200"
else
    echo "   ❌ Root route returned $response1"
fi

# Test dashboard route
echo "✅ Testing dashboard route (/dashboard)..."
response2=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/dashboard)
if [ "$response2" = "200" ]; then
    echo "   ✅ Dashboard route returns 200"
else
    echo "   ❌ Dashboard route returned $response2"
fi

# Test extract route
echo "✅ Testing extract route (/extract)..."
response3=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/extract)
if [ "$response3" = "200" ]; then
    echo "   ✅ Extract route returns 200"
else
    echo "   ❌ Extract route returned $response3"
fi

# Test that all routes return the same content (SPA)
echo ""
echo "Testing that all routes return the SPA content..."

root_content=$(curl -s http://localhost:3000/ | grep -c "StoryboardR")
dashboard_content=$(curl -s http://localhost:3000/dashboard | grep -c "StoryboardR")
extract_content=$(curl -s http://localhost:3000/extract | grep -c "StoryboardR")

if [ "$root_content" -gt 0 ] && [ "$dashboard_content" -gt 0 ] && [ "$extract_content" -gt 0 ]; then
    echo "   ✅ All routes serve SPA content"
else
    echo "   ❌ Routes serve different content (not SPA)"
fi

# Test API routes work
echo ""
echo "Testing that API routes work..."

api_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/api/projects)
if [ "$api_response" = "200" ]; then
    echo "   ✅ API routes work correctly"
else
    echo "   ❌ API routes returned $api_response"
fi

echo ""
echo "🎉 SPA Navigation Test Complete!"
echo "All routes should serve the same SPA (app.html) file."
echo "Navigation should be handled by hash routing (#home, #extract, etc.)"
