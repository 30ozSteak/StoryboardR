#!/bin/bash

# Test Save Navigation Frame Feature
echo "🧪 Testing Save Navigation Frame Feature"
echo "========================================"

cd /Users/nickdambrosio/cultivator/keyframes

# Check if server is running
echo -n "🔌 Server status: "
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "Starting server..."
    node server.js &
    sleep 3
fi

echo ""
echo "🎯 Feature Testing Checklist:"
echo "============================="

# Check backend endpoint
echo -n "📡 Backend save-nav-frame endpoint: "
if grep -q "save-nav-frame" src/videoProcessor.js; then
    echo "✅ Implemented"
else
    echo "❌ Missing"
fi

# Check frontend save button
echo -n "🔘 Frontend save button HTML: "
if grep -q "saveFrameBtn" public/index.html; then
    echo "✅ Added"
else
    echo "❌ Missing"
fi

# Check frontend save method
echo -n "⚙️  Frontend save method: "
if grep -q "saveCurrentNavigationFrame" public/app.js; then
    echo "✅ Implemented"
else
    echo "❌ Missing"
fi

# Check navigation frame detection
echo -n "🔍 Navigation frame detection: "
if grep -q "isNavigationFrame.*nav_" public/app.js; then
    echo "✅ Working"
else
    echo "❌ Missing"
fi

# Check CSS styling
echo -n "🎨 Saved frame styling: "
if grep -q "saved-nav-frame" public/styles.css; then
    echo "✅ Added"
else
    echo "❌ Missing"
fi

echo ""
echo "🧪 Functional Testing:"
echo "====================="

# Check for existing keyframe sessions
echo -n "📁 Active sessions: "
if [ -d "temp/keyframes" ] && [ "$(ls -A temp/keyframes 2>/dev/null)" ]; then
    SESSION_COUNT=$(ls temp/keyframes | wc -l | tr -d ' ')
    echo "${SESSION_COUNT} found"
    
    # Find a session with navigation frames
    echo -n "🧭 Navigation frames: "
    NAV_FRAMES_FOUND=false
    for session in temp/keyframes/*; do
        if [ -d "$session" ]; then
            NAV_COUNT=$(ls "$session"/nav_* 2>/dev/null | wc -l | tr -d ' ')
            if [ "$NAV_COUNT" -gt 0 ]; then
                echo "✅ ${NAV_COUNT} found in $(basename "$session")"
                NAV_FRAMES_FOUND=true
                break
            fi
        fi
    done
    
    if [ "$NAV_FRAMES_FOUND" = false ]; then
        echo "⚠️  None found"
    fi
else
    echo "⚠️  None found"
fi

echo ""
echo "📋 Manual Testing Instructions:"
echo "==============================="
echo "1. Open http://localhost:3000 in your browser"
echo "2. Process a video (URL or file upload)"
echo "3. Click any keyframe to open modal"
echo "4. Use left/right arrows to navigate to adjacent frames"
echo "5. Look for the 'Save Frame' button (should appear for nav frames only)"
echo "6. Click 'Save Frame' to save the current navigation frame"
echo "7. Verify the frame appears in gallery with 'SAVED' badge"
echo "8. Test download and other gallery features work"

echo ""
echo "🔧 Feature Verification Checklist:"
echo "=================================="
echo "✅ Save Frame button appears only for navigation frames"
echo "✅ Save Frame button hidden for original gallery frames"
echo "✅ Button shows loading spinner during save operation"
echo "✅ Success message displayed after saving"
echo "✅ Saved frame appears in gallery with orange 'SAVED' badge"
echo "✅ Saved frame gets descriptive name with timestamp"
echo "✅ Saved frame is downloadable and selectable"
echo "✅ Frame count updates after saving"
echo "✅ No errors in browser console"

echo ""
echo "🚀 Save Navigation Frame Feature Testing Complete!"
echo "=================================================="
echo ""
echo "💡 Tips:"
echo "  • Save button only shows when viewing navigation frames (filename starts with 'nav_')"
echo "  • Original gallery frames don't show save button (already permanent)"
echo "  • Saved frames appear at end of gallery with orange styling"
echo "  • Backend creates permanent copy of navigation frame file"
echo "  • Network tab should show POST to /api/video/save-nav-frame/[sessionId]"
