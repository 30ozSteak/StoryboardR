#!/bin/bash

echo "🧪 Testing SPA Structure and Navigation"
echo "======================================="

echo ""
echo "1. Testing if SPA JavaScript loads correctly:"
response=$(curl -s http://localhost:3000)
if echo "$response" | grep -q 'src="spa.js"'; then
    echo "   ✅ spa.js script tag found"
else
    echo "   ❌ spa.js script tag missing"
fi

echo ""
echo "2. Testing browser console access:"
echo "   Open http://localhost:3000 in your browser"
echo "   Open Developer Tools (F12)"
echo "   Look for console messages starting with:"
echo "   - 🚀 Initializing StoryboardR SPA..."
echo "   - 🔗 Setting up navigation, found X nav links"
echo "   - 🔄 Route change detected:"
echo ""
echo "3. Click each navigation item and check console for:"
echo "   - 🖱️ Nav link clicked: route=\"extract\""
echo "   - 🚀 SPA Navigate called: extract"
echo "   - ✅ Route \"extract\" found, executing..."
echo ""
echo "4. If you see 'Route not found' or routes defaulting to home,"
echo "   the issue is in the route parsing logic."

echo ""
echo "🔍 Quick manual test:"
echo "   1. Visit: http://localhost:3000#extract"
echo "   2. Check if URL stays as #extract or changes to #home"
echo "   3. If it changes to #home, the route is not being recognized"
