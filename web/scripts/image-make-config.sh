#!/bin/bash

cat <<EOF
{
  "Dirs": ["public"],
  "Env": {
    "SPA_MODE": "1"
  },
  "CloudConfig": {
    "Platform": "aws",
    "Zone": "$AWS_REGION",
    "BucketName": "$AWS_BUCKET_NAME"
  }
}

EOF
