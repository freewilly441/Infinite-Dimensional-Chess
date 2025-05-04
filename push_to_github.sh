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

# Configure Git
echo "Configuring Git..."
git config --global credential.helper store
echo "https://oauth2:$GITHUB_TOKEN@github.com" > ~/.git-credentials
git config --global user.name "GitHub Action"
git config --global user.email "action@github.com"

# Check if this is already a git repo
if [ ! -d .git ]; then
  echo "Initializing Git repository..."
  git init
  git branch -M main
  
  echo "Adding remote repository..."
  git remote add origin $REPO_URL
else
  echo "Git repository already initialized."
  # Update remote URL if needed
  git remote set-url origin $REPO_URL
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