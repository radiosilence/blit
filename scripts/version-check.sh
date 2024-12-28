#!/bin/bash
# scripts/version-check.sh

# Exit on errors
set -e

# Get the current package version
CURRENT_VERSION=$(jq -r .version package.json)

# Fetch the latest changes from remote without merging
git fetch origin

# Get the version from the remote main branch
# Note: replace 'main' with 'master' or your default branch name if different
LAST_VERSION=$(git show origin/main:package.json 2>/dev/null | jq -r .version || echo "none")

# If we couldn't get the remote version (e.g., first push), try local HEAD
if [ "$LAST_VERSION" = "none" ]; then
    LAST_VERSION=$(git show HEAD:package.json 2>/dev/null | jq -r .version || echo "none")
    echo "⚠️  Could not find version in remote, using local HEAD version"
fi

# Check if version has changed
if [ "$CURRENT_VERSION" = "$LAST_VERSION" ]; then
    echo "⚠️  Warning: Package version has not been updated"
    echo "Current version: $CURRENT_VERSION"
    echo "Remote version: $LAST_VERSION"
    echo "Consider updating the version in package.json before pushing"
    exit 0
fi

# Check if this version tag already exists (both locally and remotely)
if git rev-parse "v$CURRENT_VERSION" >/dev/null 2>&1 ||
    git ls-remote --tags origin "refs/tags/v$CURRENT_VERSION" | grep -q ".*"; then
    echo "⚠️  Warning: Tag v$CURRENT_VERSION already exists locally or remotely"
    exit 0
fi

# Create an annotated tag with the version
git tag -a "v$CURRENT_VERSION" -m "Version $CURRENT_VERSION"

# Push the tag to remote
# Note: We use the full refs path to be explicit
git push origin "refs/tags/v$CURRENT_VERSION"

echo "✅ Successfully created and pushed tag v$CURRENT_VERSION"
echo "Remote version was: $LAST_VERSION"
echo "New version is: $CURRENT_VERSION"
exit 0
