#!/bin/bash

echo "Creating build"
npm run build
echo "Creating docs"
npx typedoc --cname sdk-docs.supra.com --out docs src/index.ts
