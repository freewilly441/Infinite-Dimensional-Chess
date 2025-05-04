#!/bin/bash

# Usage information
echo "GitHub Push Helper Script"
echo "========================="
echo ""

# Check if repository URL is provided
if [ "$#" -lt 1 ]; then
  echo "Usage: ./push_to_github.sh <repository_url> [commit_message]"
  echo "Example: ./push_to_github.sh https://github.com/username/repo.git 'Updated README with mathematical concepts'"
  exit 1
fi

REPO_URL=$1
COMMIT_MESSAGE=${2:-"Updated n-dimensional chess project"}

# Extract username and repo from URL
if [[ $REPO_URL =~ github\.com[:/]([^/]+)/([^/.]+)(.git)? ]]; then
  USERNAME="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
  AUTH_URL="https://${USERNAME}:${GITHUB_TOKEN}@github.com/${USERNAME}/${REPO}.git"
else
  echo "Error: Unable to parse GitHub repository URL"
  exit 1
fi

# Configure Git
echo "Configuring Git..."
git config --global user.name "N-Dimensional Chess Bot"
git config --global user.email "ndchess@example.com"

# Check if this is already a git repo
if [ ! -d .git ]; then
  echo "Initializing Git repository..."
  git init
  git branch -M main
  
  echo "Adding remote repository..."
  git remote add origin "$AUTH_URL"
else
  echo "Git repository already initialized."
  # Update remote URL with authentication
  git remote set-url origin "$AUTH_URL"
fi

# Add all changes
echo "Adding changes to staging area..."
git add .

# Commit changes
echo "Committing changes with message: '$COMMIT_MESSAGE'"
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes to GitHub..."
git push -u origin main

echo ""
echo "Completed! Please check your GitHub repository to verify the changes were pushed successfully."