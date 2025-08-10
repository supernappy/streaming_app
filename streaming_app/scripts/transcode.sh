#!/bin/bash

# FFmpeg Audio Transcoding Script for OpenStream
# Converts audio files to HLS format with multiple bitrates

set -e

# Default values
INPUT_FILE=""
OUTPUT_DIR=""
SEGMENT_DURATION=10
PLAYLIST_SIZE=5
BITRATES="128k 256k 320k"

# Function to show usage
usage() {
    echo "Usage: $0 -i INPUT_FILE -o OUTPUT_DIR [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -i INPUT_FILE       Input audio file"
    echo "  -o OUTPUT_DIR       Output directory for HLS files"
    echo "  -d DURATION         Segment duration in seconds (default: 10)"
    echo "  -s SIZE             Playlist size (default: 5)"
    echo "  -b BITRATES         Space-separated bitrates (default: '128k 256k 320k')"
    echo "  -h                  Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -i song.mp3 -o ./hls/song -d 10 -s 5 -b '128k 256k 320k'"
    exit 1
}

# Parse command line arguments
while getopts "i:o:d:s:b:h" opt; do
    case $opt in
        i) INPUT_FILE="$OPTARG" ;;
        o) OUTPUT_DIR="$OPTARG" ;;
        d) SEGMENT_DURATION="$OPTARG" ;;
        s) PLAYLIST_SIZE="$OPTARG" ;;
        b) BITRATES="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

# Validate required arguments
if [ -z "$INPUT_FILE" ] || [ -z "$OUTPUT_DIR" ]; then
    echo "Error: Input file and output directory are required"
    usage
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' does not exist"
    exit 1
fi

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed or not in PATH"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎵 Starting audio transcoding..."
echo "Input: $INPUT_FILE"
echo "Output: $OUTPUT_DIR"
echo "Bitrates: $BITRATES"

# Get audio information
echo "📊 Analyzing input file..."
DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$INPUT_FILE")
SAMPLE_RATE=$(ffprobe -v quiet -show_entries stream=sample_rate -select_streams a:0 -of csv=p=0 "$INPUT_FILE")

echo "Duration: ${DURATION}s"
echo "Sample Rate: ${SAMPLE_RATE}Hz"

# Master playlist content
MASTER_PLAYLIST="$OUTPUT_DIR/playlist.m3u8"
echo "#EXTM3U" > "$MASTER_PLAYLIST"
echo "#EXT-X-VERSION:3" >> "$MASTER_PLAYLIST"

# Process each bitrate
for BITRATE in $BITRATES; do
    echo "🔧 Processing bitrate: $BITRATE"
    
    # Create bitrate-specific directory
    BITRATE_DIR="$OUTPUT_DIR/$BITRATE"
    mkdir -p "$BITRATE_DIR"
    
    # Generate HLS segments
    ffmpeg -i "$INPUT_FILE" \
        -c:a aac \
        -b:a "$BITRATE" \
        -ar "$SAMPLE_RATE" \
        -f hls \
        -hls_time "$SEGMENT_DURATION" \
        -hls_list_size "$PLAYLIST_SIZE" \
        -hls_segment_filename "$BITRATE_DIR/segment_%03d.ts" \
        "$BITRATE_DIR/playlist.m3u8" \
        -y
    
    # Add to master playlist
    echo "#EXT-X-STREAM-INF:BANDWIDTH=$(echo $BITRATE | sed 's/k/000/'),CODECS=\"mp4a.40.2\"" >> "$MASTER_PLAYLIST"
    echo "$BITRATE/playlist.m3u8" >> "$MASTER_PLAYLIST"
    
    echo "✅ Completed bitrate: $BITRATE"
done

# Generate metadata file
METADATA_FILE="$OUTPUT_DIR/metadata.json"
cat > "$METADATA_FILE" << EOF
{
    "original_file": "$(basename "$INPUT_FILE")",
    "duration": $DURATION,
    "sample_rate": $SAMPLE_RATE,
    "bitrates": [$(echo "$BITRATES" | sed 's/ /", "/g' | sed 's/^/"/; s/$/"/')]",
    "segment_duration": $SEGMENT_DURATION,
    "playlist_size": $PLAYLIST_SIZE,
    "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Calculate total size
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)

echo ""
echo "🎉 Transcoding completed successfully!"
echo "📁 Output directory: $OUTPUT_DIR"
echo "📊 Total size: $TOTAL_SIZE"
echo "🎵 Master playlist: $MASTER_PLAYLIST"
echo ""
echo "Generated files:"
find "$OUTPUT_DIR" -type f -name "*.m3u8" -o -name "*.ts" -o -name "*.json" | sort
