#!/bin/bash

echo "Creating build"
npm run build
echo "Creating doc"
npx typedoc --out doc src/index.ts
