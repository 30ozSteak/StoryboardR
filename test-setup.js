const keyframeExtractor = require('./src/keyframeExtractor');

// Test FFmpeg availability
async function testFFmpeg() {
  console.log('Testing FFmpeg availability...');
  
  const isAvailable = await keyframeExtractor.checkFFmpegAvailability();
  
  if (isAvailable) {
    console.log('✅ FFmpeg is installed and available');
  } else {
    console.log('❌ FFmpeg is not available. Please install FFmpeg first.');
    console.log('macOS: brew install ffmpeg');
    console.log('Ubuntu: sudo apt install ffmpeg');
    process.exit(1);
  }
}

// Run the test
testFFmpeg().catch(console.error);
