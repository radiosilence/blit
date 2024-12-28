#!/bin/bash
# scripts/version-check.sh

# Exit on errors
set -e

# Get the current package version
CURRENT_VERSION=$(jq -r .version package.json)

# Get the version from the last commit
LAST_VERSION=$(git show HEAD:package.json 2>/dev/null | jq -r .version || echo "none")

# Check if version has changed
if [ "$CURRENT_VERSION" = "$LAST_VERSION" ]; then
    echo "⚠️  Warning: Package version has not been updated"
    echo "Current version: $CURRENT_VERSION"
    echo "Consider updating the version in package.json before pushing"
    exit 0 # Changed from exit 1 to exit 0 to make it just a warning
fi

# Check if this version tag already exists
if git rev-parse "v$CURRENT_VERSION" >/dev/null 2>&1; then
    echo "⚠️  Warning: Tag v$CURRENT_VERSION already exists"
    exit 0
fi

# Create an annotated tag with the version
git tag -a "v$CURRENT_VERSION" -m "Version $CURRENT_VERSION"

echo "✅ Successfully created tag v$CURRENT_VERSION"
exit 0
