#!/bin/bash

# Batch Audio Transcoding Script for OpenStream
# Processes multiple audio files in a directory

set -e

# Default values
INPUT_DIR=""
OUTPUT_BASE_DIR=""
SEGMENT_DURATION=10
PLAYLIST_SIZE=5
BITRATES="128k 256k 320k"
PARALLEL_JOBS=4

# Supported audio formats
AUDIO_FORMATS="mp3|wav|flac|aac|ogg|m4a"

# Function to show usage
usage() {
    echo "Usage: $0 -i INPUT_DIR -o OUTPUT_BASE_DIR [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -i INPUT_DIR        Input directory containing audio files"
    echo "  -o OUTPUT_BASE_DIR  Base output directory for HLS files"
    echo "  -d DURATION         Segment duration in seconds (default: 10)"
    echo "  -s SIZE             Playlist size (default: 5)"
    echo "  -b BITRATES         Space-separated bitrates (default: '128k 256k 320k')"
    echo "  -j JOBS             Number of parallel jobs (default: 4)"
    echo "  -h                  Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -i ./music -o ./hls -j 2"
    exit 1
}

# Parse command line arguments
while getopts "i:o:d:s:b:j:h" opt; do
    case $opt in
        i) INPUT_DIR="$OPTARG" ;;
        o) OUTPUT_BASE_DIR="$OPTARG" ;;
        d) SEGMENT_DURATION="$OPTARG" ;;
        s) PLAYLIST_SIZE="$OPTARG" ;;
        b) BITRATES="$OPTARG" ;;
        j) PARALLEL_JOBS="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

# Validate required arguments
if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_BASE_DIR" ]; then
    echo "Error: Input directory and output base directory are required"
    usage
fi

# Check if input directory exists
if [ ! -d "$INPUT_DIR" ]; then
    echo "Error: Input directory '$INPUT_DIR' does not exist"
    exit 1
fi

# Check if transcode script exists
TRANSCODE_SCRIPT="$(dirname "$0")/transcode.sh"
if [ ! -f "$TRANSCODE_SCRIPT" ]; then
    echo "Error: transcode.sh script not found at $TRANSCODE_SCRIPT"
    exit 1
fi

# Create output base directory
mkdir -p "$OUTPUT_BASE_DIR"

echo "🎵 Starting batch audio transcoding..."
echo "Input directory: $INPUT_DIR"
echo "Output directory: $OUTPUT_BASE_DIR"
echo "Parallel jobs: $PARALLEL_JOBS"
echo "Bitrates: $BITRATES"
echo ""

# Find all audio files
echo "🔍 Scanning for audio files..."
AUDIO_FILES=$(find "$INPUT_DIR" -type f -iregex ".*\.\($AUDIO_FORMATS\)$" | sort)
TOTAL_FILES=$(echo "$AUDIO_FILES" | wc -l)

if [ -z "$AUDIO_FILES" ] || [ "$TOTAL_FILES" -eq 0 ]; then
    echo "❌ No audio files found in $INPUT_DIR"
    echo "Supported formats: ${AUDIO_FORMATS//|/, }"
    exit 1
fi

echo "📁 Found $TOTAL_FILES audio files to process"
echo ""

# Create processing log
LOG_FILE="$OUTPUT_BASE_DIR/batch_transcode.log"
echo "Batch transcoding started at $(date)" > "$LOG_FILE"
echo "Input: $INPUT_DIR" >> "$LOG_FILE"
echo "Output: $OUTPUT_BASE_DIR" >> "$LOG_FILE"
echo "Total files: $TOTAL_FILES" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to process a single file
process_file() {
    local input_file="$1"
    local file_number="$2"
    local total="$3"
    
    # Generate output directory name based on input file
    local basename=$(basename "$input_file")
    local filename_no_ext="${basename%.*}"
    local output_dir="$OUTPUT_BASE_DIR/$filename_no_ext"
    
    echo "[$file_number/$total] Processing: $basename"
    
    # Run transcoding
    if "$TRANSCODE_SCRIPT" \
        -i "$input_file" \
        -o "$output_dir" \
        -d "$SEGMENT_DURATION" \
        -s "$PLAYLIST_SIZE" \
        -b "$BITRATES" >> "$LOG_FILE" 2>&1; then
        
        echo "✅ [$file_number/$total] Completed: $basename"
        echo "SUCCESS: $basename" >> "$LOG_FILE"
    else
        echo "❌ [$file_number/$total] Failed: $basename"
        echo "FAILED: $basename" >> "$LOG_FILE"
        return 1
    fi
}

# Export function for parallel execution
export -f process_file
export TRANSCODE_SCRIPT SEGMENT_DURATION PLAYLIST_SIZE BITRATES OUTPUT_BASE_DIR LOG_FILE

# Process files in parallel
echo "🚀 Starting parallel processing with $PARALLEL_JOBS jobs..."
echo ""

# Create temporary file list with numbers
TEMP_FILE_LIST=$(mktemp)
echo "$AUDIO_FILES" | nl -nln > "$TEMP_FILE_LIST"

# Use GNU parallel or xargs for parallel processing
if command -v parallel &> /dev/null; then
    # Use GNU parallel
    cat "$TEMP_FILE_LIST" | parallel -j "$PARALLEL_JOBS" --colsep '\t' process_file {2} {1} "$TOTAL_FILES"
else
    # Fallback to xargs
    cat "$TEMP_FILE_LIST" | xargs -n 2 -P "$PARALLEL_JOBS" -I {} bash -c 'process_file "$2" "$1" "'$TOTAL_FILES'"' _ {}
fi

# Clean up temporary file
rm "$TEMP_FILE_LIST"

# Calculate statistics
SUCCESSFUL_COUNT=$(grep -c "SUCCESS:" "$LOG_FILE" || echo "0")
FAILED_COUNT=$(grep -c "FAILED:" "$LOG_FILE" || echo "0")
TOTAL_SIZE=$(du -sh "$OUTPUT_BASE_DIR" | cut -f1)

echo ""
echo "🎉 Batch transcoding completed!"
echo "📊 Statistics:"
echo "   Total files: $TOTAL_FILES"
echo "   Successful: $SUCCESSFUL_COUNT"
echo "   Failed: $FAILED_COUNT"
echo "   Total output size: $TOTAL_SIZE"
echo ""
echo "📁 Output directory: $OUTPUT_BASE_DIR"
echo "📋 Log file: $LOG_FILE"

# Show failed files if any
if [ "$FAILED_COUNT" -gt 0 ]; then
    echo ""
    echo "❌ Failed files:"
    grep "FAILED:" "$LOG_FILE" | sed 's/FAILED: /  - /'
fi

echo ""
echo "✅ Batch processing complete!"

# Append completion to log
echo "" >> "$LOG_FILE"
echo "Batch transcoding completed at $(date)" >> "$LOG_FILE"
echo "Successful: $SUCCESSFUL_COUNT" >> "$LOG_FILE"
echo "Failed: $FAILED_COUNT" >> "$LOG_FILE"
echo "Total output size: $TOTAL_SIZE" >> "$LOG_FILE"
