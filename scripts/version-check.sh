#!/bin/bash
# scripts/version-check.sh

# Get the current package version
CURRENT_VERSION=$(jq -r .version package.json)

# Get the version from the last commit
LAST_VERSION=$(git show HEAD:package.json 2>/dev/null | jq -r .version)

# Check if version has changed
if [ "$CURRENT_VERSION" = "$LAST_VERSION" ]; then
    echo "❌ Error: Package version has not been updated"
    echo "Current version: $CURRENT_VERSION"
    echo "Please update the version in package.json before pushing"
    exit 1
fi

# Check if this version tag already exists
if git rev-parse "v$CURRENT_VERSION" >/dev/null 2>&1; then
    echo "❌ Error: Tag v$CURRENT_VERSION already exists"
    exit 1
fi

# Create an annotated tag with the version
git tag -a "v$CURRENT_VERSION" -m "Version $CURRENT_VERSION"

echo "✅ Successfully created tag v$CURRENT_VERSION"
exit 0
