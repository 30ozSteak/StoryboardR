#!/bin/bash

echo "Testing CSS Modules and API Endpoints..."
echo "========================================"

# Test CSS modules accessibility
echo "1. Testing CSS modules..."
echo -n "Main styles.css: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/styles.css
echo ""

echo -n "Base module: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/styles/base.css
echo ""

echo -n "Theme module: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/styles/theme.css
echo ""

echo -n "Video Processor module: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/styles/video-processor.css
echo ""

echo -n "Keyframe Manager module: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/styles/keyframe-manager.css
echo ""

# Test API endpoints
echo -e "\n2. Testing API endpoints..."
echo -n "Server health: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health
echo ""

echo -n "Projects API: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/projects
echo ""

# Test CSS content loading (check if @import is working)
echo -e "\n3. Testing CSS import functionality..."
echo "Checking if main CSS contains import statements:"
curl -s http://localhost:3000/styles.css | head -20 | grep -c "@import"

echo -e "\n4. Testing if CSS variables are loaded..."
echo "Checking if base.css contains CSS variables:"
curl -s http://localhost:3000/styles/base.css | grep -c "\-\-primary-color"

echo -e "\nTesting complete!"
