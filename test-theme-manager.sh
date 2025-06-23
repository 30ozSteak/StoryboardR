#!/bin/bash

echo "Testing Modular CSS and Theme Manager Implementation..."
echo "======================================================="

# Test if server is running
echo "1. Testing server health..."
curl -s http://localhost:3000/health || echo "Server not responding"

# Test if theme test page loads
echo -e "\n2. Testing theme test page..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/test-theme.html

# Test if main app loads
echo -e "\n3. Testing main app page..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/index.html

# Test if modules are accessible
echo -e "\n4. Testing module accessibility..."
curl -s -o /dev/null -w "ThemeManager.js: %{http_code}" http://localhost:3000/modules/ThemeManager.js
echo ""
curl -s -o /dev/null -w "EventBus.js: %{http_code}" http://localhost:3000/modules/EventBus.js
echo ""
curl -s -o /dev/null -w "app_modular.js: %{http_code}" http://localhost:3000/app_modular.js

# Test if CSS modules are accessible
echo -e "\n5. Testing CSS module accessibility..."
curl -s -o /dev/null -w "styles.css: %{http_code}" http://localhost:3000/styles.css
echo ""
curl -s -o /dev/null -w "base.css: %{http_code}" http://localhost:3000/styles/base.css
echo ""
curl -s -o /dev/null -w "theme.css: %{http_code}" http://localhost:3000/styles/theme.css
echo ""
curl -s -o /dev/null -w "keyframe-manager.css: %{http_code}" http://localhost:3000/styles/keyframe-manager.css
echo ""
curl -s -o /dev/null -w "modal-manager.css: %{http_code}" http://localhost:3000/styles/modal-manager.css

echo -e "\n\n6. Checking for JavaScript syntax errors..."
node -c public/modules/ThemeManager.js && echo "✓ ThemeManager.js syntax OK"
node -c public/app_modular.js && echo "✓ app_modular.js syntax OK"

echo -e "\n7. Checking CSS file structure..."
ls -la public/styles/ && echo "✓ CSS modules created"
[ -f public/styles.css.monolithic.backup ] && echo "✓ Original styles.css backed up"

echo -e "\nModular CSS and Theme Manager testing complete!"
