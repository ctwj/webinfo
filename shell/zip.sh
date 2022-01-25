#!/bin/bash

# Version key/value should be on his own line
PACKAGE_VERSION=$(cat src/manifest.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

zipPath="./test_${PACKAGE_VERSION}.zip"

echo $zipPath

npm run build

rm -rf dist/*.zip

cd dist

zip -r -D $zipPath *