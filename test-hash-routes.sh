#!/bin/bash

echo "🧪 Testing SPA Navigation Routes"
echo "================================="

# Test that each hash route works correctly
echo ""
echo "Testing direct hash navigation..."

# Test extract route
echo "Testing #extract route:"
curl -s "http://localhost:3000#extract" | head -10

echo ""
echo "Testing #editor route:"
curl -s "http://localhost:3000#editor" | head -10

echo ""
echo "Testing #settings route:"
curl -s "http://localhost:3000#settings" | head -10

echo ""
echo "All routes should serve the same SPA content."
echo "The routing happens client-side with JavaScript."
echo "Check browser console for SPA route debugging info."
