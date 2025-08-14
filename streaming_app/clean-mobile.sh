#!/bin/bash
# Automated cleanup script for React Native/Expo mobile project
set -e

cd "$(dirname "$0")/mobile"

echo "Removing node_modules and lock files..."
rm -rf node_modules package-lock.json yarn.lock

# Remove any nested node_modules
find . -type d -name "node_modules" -not -path "./node_modules" -exec rm -rf {} +

echo "Clearing Metro/Expo/React Native cache..."
if [ -f "package.json" ] && grep -q 'expo' package.json; then
  npx expo start -c || true
else
  npx react-native start --reset-cache || true
fi

echo "Reinstalling dependencies..."
npm install

echo "Checking for duplicate React installs..."
npm ls react || true

echo "Cleanup complete! Please restart your simulator/device and try running the app again."
