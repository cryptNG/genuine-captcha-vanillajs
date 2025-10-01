#!/bin/bash

# Deployment script for novent web application
set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Step 1: Clean up old dist folder
echo "📁 Cleaning up old dist folder..."
cd ~/genuine-captcha-vanillajs
rm -rf *

# Step 2: Copy the application
echo "🔨 Copying application..."
cd ~/genuine-captcha/sources/genuine-captcha-vanillajs

rsync -av --exclude='~/genuine-captcha/sources/genuine-captcha-vanillajs/deploy.sh' ~/genuine-captcha/sources/genuine-captcha-vanillajs/ ~/genuine-captcha-vanillajs

# Step 3: Commit and push changes
echo "📤 Committing and pushing changes..."
cd ~/genuine-captcha-vanillajs
git add *
git commit -a -m "updated js files"
git push

echo "✅ Deployment completed successfully!"