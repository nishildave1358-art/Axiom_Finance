#!/bin/bash

# Axiom Finance - One-Click Deployment Script
# This script helps you deploy to your preferred platform

set -e

echo "🚀 Axiom Finance Deployment Script"
echo "===================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Please create a .env file with VITE_CONVEX_URL"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the project
echo "📦 Building project..."
npm install
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "Choose deployment method:"
echo "1) Vercel"
echo "2) Netlify"
echo "3) Manual (just show instructions)"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "Vercel CLI not found. Installing..."
            npm i -g vercel
            vercel --prod
        fi
        ;;
    2)
        echo ""
        echo "🚀 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod
        else
            echo "Netlify CLI not found. Installing..."
            npm i -g netlify-cli
            netlify deploy --prod
        fi
        ;;
    3)
        echo ""
        echo "📋 Manual Deployment Instructions:"
        echo "1. Your built files are in the 'dist' folder"
        echo "2. Upload the contents of 'dist' to your hosting provider"
        echo "3. Make sure to set VITE_CONVEX_URL environment variable"
        echo ""
        echo "Popular hosting options:"
        echo "- Vercel: https://vercel.com"
        echo "- Netlify: https://netlify.com"
        echo "- Cloudflare Pages: https://pages.cloudflare.com"
        echo "- GitHub Pages: https://pages.github.com"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Deployment process complete!"
echo ""

