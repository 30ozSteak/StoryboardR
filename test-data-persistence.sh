#!/bin/bash

# Test script for Data Persistence API endpoints
# Tests the new storyboard and extraction APIs

echo "🧪 Testing Data Persistence API Endpoints"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Function to check if server is running
check_server() {
    echo -e "${BLUE}🔍 Checking if server is running...${NC}"
    if curl -s "$BASE_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not running. Please start the server first.${NC}"
        return 1
    fi
}

# Function to test storyboard APIs
test_storyboards() {
    echo -e "\n${BLUE}📖 Testing Storyboard APIs${NC}"
    echo "----------------------------"
    
    # Test 1: Create a storyboard
    echo -e "${YELLOW}Creating a test storyboard...${NC}"
    STORYBOARD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/storyboards" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Storyboard",
            "description": "A test storyboard for API validation",
            "videoSource": "https://example.com/video.mp4",
            "keyframes": [
                {
                    "filename": "keyframe_001.jpg",
                    "url": "http://localhost:3000/keyframes/test/keyframe_001.jpg",
                    "timestamp": 0,
                    "index": 0
                },
                {
                    "filename": "keyframe_002.jpg", 
                    "url": "http://localhost:3000/keyframes/test/keyframe_002.jpg",
                    "timestamp": 5,
                    "index": 1
                }
            ],
            "metadata": {
                "created_by": "test-script",
                "version": "1.0"
            }
        }')
    
    if echo "$STORYBOARD_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Storyboard created successfully${NC}"
        STORYBOARD_ID=$(echo "$STORYBOARD_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "   📝 Storyboard ID: $STORYBOARD_ID"
    else
        echo -e "${RED}❌ Failed to create storyboard${NC}"
        echo "   Response: $STORYBOARD_RESPONSE"
        return 1
    fi
    
    # Test 2: Get all storyboards
    echo -e "${YELLOW}Fetching all storyboards...${NC}"
    ALL_STORYBOARDS=$(curl -s "$BASE_URL/api/storyboards")
    if echo "$ALL_STORYBOARDS" | grep -q '"storyboards"'; then
        echo -e "${GREEN}✅ Successfully fetched storyboards list${NC}"
        STORYBOARD_COUNT=$(echo "$ALL_STORYBOARDS" | grep -o '"storyboards":\[.*\]' | grep -o '\{[^}]*\}' | wc -l)
        echo -e "   📊 Total storyboards: $STORYBOARD_COUNT"
    else
        echo -e "${RED}❌ Failed to fetch storyboards${NC}"
    fi
    
    # Test 3: Get specific storyboard
    if [ ! -z "$STORYBOARD_ID" ]; then
        echo -e "${YELLOW}Fetching specific storyboard ($STORYBOARD_ID)...${NC}"
        SINGLE_STORYBOARD=$(curl -s "$BASE_URL/api/storyboards/$STORYBOARD_ID")
        if echo "$SINGLE_STORYBOARD" | grep -q '"storyboard"'; then
            echo -e "${GREEN}✅ Successfully fetched specific storyboard${NC}"
        else
            echo -e "${RED}❌ Failed to fetch specific storyboard${NC}"
        fi
        
        # Test 4: Update storyboard
        echo -e "${YELLOW}Updating storyboard...${NC}"
        UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/storyboards/$STORYBOARD_ID" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "Updated Test Storyboard",
                "description": "Updated description for testing"
            }')
        
        if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Storyboard updated successfully${NC}"
        else
            echo -e "${RED}❌ Failed to update storyboard${NC}"
        fi
        
        # Test 5: Delete storyboard (commented out to preserve data)
        # echo -e "${YELLOW}Deleting storyboard...${NC}"
        # DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/storyboards/$STORYBOARD_ID")
        # if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        #     echo -e "${GREEN}✅ Storyboard deleted successfully${NC}"
        # else
        #     echo -e "${RED}❌ Failed to delete storyboard${NC}"
        # fi
    fi
}

# Function to test extraction APIs
test_extractions() {
    echo -e "\n${BLUE}🎬 Testing Extraction APIs${NC}"
    echo "----------------------------"
    
    # Test 1: Create an extraction
    echo -e "${YELLOW}Creating a test extraction...${NC}"
    EXTRACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/extractions" \
        -H "Content-Type: application/json" \
        -d '{
            "videoUrl": "https://example.com/test-video.mp4",
            "sessionId": "test-session-123",
            "keyframes": [
                {
                    "filename": "frame_001.jpg",
                    "url": "http://localhost:3000/keyframes/test-session-123/frame_001.jpg",
                    "timestamp": 0,
                    "index": 0
                },
                {
                    "filename": "frame_002.jpg",
                    "url": "http://localhost:3000/keyframes/test-session-123/frame_002.jpg", 
                    "timestamp": 3,
                    "index": 1
                },
                {
                    "filename": "frame_003.jpg",
                    "url": "http://localhost:3000/keyframes/test-session-123/frame_003.jpg",
                    "timestamp": 6,
                    "index": 2
                }
            ],
            "settings": {
                "interval": 3,
                "quality": "medium",
                "maxFrames": 20
            },
            "metadata": {
                "created_by": "test-script",
                "purpose": "API validation"
            }
        }')
    
    if echo "$EXTRACTION_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Extraction created successfully${NC}"
        EXTRACTION_ID=$(echo "$EXTRACTION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "   📝 Extraction ID: $EXTRACTION_ID"
    else
        echo -e "${RED}❌ Failed to create extraction${NC}"
        echo "   Response: $EXTRACTION_RESPONSE"
        return 1
    fi
    
    # Test 2: Get all extractions
    echo -e "${YELLOW}Fetching all extractions...${NC}"
    ALL_EXTRACTIONS=$(curl -s "$BASE_URL/api/extractions")
    if echo "$ALL_EXTRACTIONS" | grep -q '"extractions"'; then
        echo -e "${GREEN}✅ Successfully fetched extractions list${NC}"
        EXTRACTION_COUNT=$(echo "$ALL_EXTRACTIONS" | grep -o '"extractions":\[.*\]' | grep -o '\{[^}]*\}' | wc -l)
        echo -e "   📊 Total extractions: $EXTRACTION_COUNT"
    else
        echo -e "${RED}❌ Failed to fetch extractions${NC}"
    fi
    
    # Test 3: Get specific extraction
    if [ ! -z "$EXTRACTION_ID" ]; then
        echo -e "${YELLOW}Fetching specific extraction ($EXTRACTION_ID)...${NC}"
        SINGLE_EXTRACTION=$(curl -s "$BASE_URL/api/extractions/$EXTRACTION_ID")
        if echo "$SINGLE_EXTRACTION" | grep -q '"extraction"'; then
            echo -e "${GREEN}✅ Successfully fetched specific extraction${NC}"
        else
            echo -e "${RED}❌ Failed to fetch specific extraction${NC}"
        fi
        
        # Test 4: Delete extraction (commented out to preserve data)
        # echo -e "${YELLOW}Deleting extraction...${NC}"
        # DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/extractions/$EXTRACTION_ID")
        # if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        #     echo -e "${GREEN}✅ Extraction deleted successfully${NC}"
        # else
        #     echo -e "${RED}❌ Failed to delete extraction${NC}"
        # fi
    fi
}

# Function to test error cases
test_error_cases() {
    echo -e "\n${BLUE}🚫 Testing Error Cases${NC}"
    echo "------------------------"
    
    # Test invalid storyboard creation
    echo -e "${YELLOW}Testing invalid storyboard creation...${NC}"
    ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/storyboards" \
        -H "Content-Type: application/json" \
        -d '{"name": ""}')
    
    if echo "$ERROR_RESPONSE" | grep -q '"error"'; then
        echo -e "${GREEN}✅ Error handling works correctly${NC}"
    else
        echo -e "${RED}❌ Error handling failed${NC}"
    fi
    
    # Test fetching non-existent storyboard
    echo -e "${YELLOW}Testing non-existent storyboard fetch...${NC}"
    NOT_FOUND_RESPONSE=$(curl -s "$BASE_URL/api/storyboards/non-existent-id")
    if echo "$NOT_FOUND_RESPONSE" | grep -q '"error"'; then
        echo -e "${GREEN}✅ 404 handling works correctly${NC}"
    else
        echo -e "${RED}❌ 404 handling failed${NC}"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting Data Persistence API Tests${NC}"
    echo "========================================"
    
    # Check if server is running
    if ! check_server; then
        echo -e "\n${RED}💡 To start the server, run: npm start${NC}"
        exit 1
    fi
    
    # Run tests
    test_storyboards
    test_extractions
    test_error_cases
    
    echo -e "\n${GREEN}🎉 Data Persistence API Tests Complete!${NC}"
    echo "========================================"
    echo -e "${BLUE}📊 Summary:${NC}"
    echo "- Storyboard API: Create, Read, Update operations tested"
    echo "- Extraction API: Create, Read operations tested"
    echo "- Error handling: Validated"
    echo ""
    echo -e "${YELLOW}💾 Data files location:${NC}"
    echo "- Storyboards: ./data/storyboards.json"
    echo "- Extractions: ./data/extractions.json"
    echo ""
    echo -e "${BLUE}🌐 Test data created and available for SPA integration testing${NC}"
}

# Run the tests
main
