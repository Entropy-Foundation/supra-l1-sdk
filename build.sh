#!/bin/bash

echo "Creating build"
npm run build
echo "Creating docs"
npx typedoc
