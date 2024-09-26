#!/bin/bash

# This script allows us to pull Aptos' legacy TypeScript SDK directly from our copy of
# `aptos-core` without having to publish a new public `npm` package (our `aptos-core` fork
# is public anyway). This is a temporary workaround that should be replaced as we work towards
# fully developing our own SDK.

set -e

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
L1_SDK_ROOT="$SCRIPT_DIR/.."
INSTALL_ROOT="$L1_SDK_ROOT/.supra_aptos_sdk"
REPO_ROOT="$INSTALL_ROOT/aptos-core"
BUILD_TARGET="$REPO_ROOT"/ecosystem/typescript/sdk/dist
VERSION="$1"

if [ -z "$VERSION" ]; then
    echo "Usage: ./install_supra_aptos_sdk <version>"
    echo "Args:"
    echo "  - version: The branch or tag of EntropyFoundation/aptos-core that contains the required"
    echo "             version of the Supra Aptos TypeScript SDK."
    exit 1
fi

GIT_MAJOR_VERSION="$(git --version | cut -d' ' -f3 | cut -d'.' -f1)"
GIT_MINOR_VERSION="$(git --version | cut -d' ' -f3 | cut -d'.' -f2)"
MIN_GIT_MAJOR_VERSION=2
MIN_GIT_MINOR_VERSION=27

# Verify the Git version. `sparse-checkout` was introduced in 2.27.
if [ "$GIT_MAJOR_VERSION" -lt "$MIN_GIT_MAJOR_VERSION" ] \
    || [ "$GIT_MAJOR_VERSION" -eq "$MIN_GIT_MAJOR_VERSION" ] \
    &&  [ "$GIT_MINOR_VERSION" -lt "$MIN_GIT_MINOR_VERSION" ]
then
    echo "Error: Git version must be at least $MIN_GIT_MAJOR_VERSION.$MIN_GIT_MINOR_VERSION" >&1
    exit 2
fi

function install() {
    echo "Installing Supra Aptos TypeScript SDK..."

    # Remove the old installation (could optimize to skip the clone if the repo already exists).
    rm -rf "$INSTALL_ROOT"
    mkdir "$INSTALL_ROOT"
    cd "$INSTALL_ROOT"

    # Clone our fork of `aptos-core`.
    #
    # `clone --filter` and `sparse-checkout` are essential for performance, since `aptos-core` is very large.
    git clone \
        --filter=blob:none \
        --no-checkout \
        --depth 1 \
        --sparse \
        --branch "$VERSION" \
        https://github.com/Entropy-Foundation/aptos-core.git \
        || (echo "Failed to clone Supra Aptos Core" && exit 3)
    cd aptos-core
    git sparse-checkout add ecosystem/typescript/sdk
    git checkout
    cd ecosystem/typescript/sdk

    # Compile the TypeScript code.
    npm install || (echo "Failed to initialize the Supra Aptos TypeScript SDK" && exit 4)
    npm run build || (echo "Failed to build the Supra Aptos TypeScript SDK" && exit 5)
    cd "$L1_SDK_ROOT"

    # And install it as a dependency of this project.
    npm install "$REPO_ROOT"/ecosystem/typescript/sdk
}

function parse_git_branch() {    
    git branch | grep '*' | cut -d' ' -f2
}

function parse_git_tag() {
    git branch | grep '*' | cut -d' ' -f5 | cut -d')' -f1
}

if [ -d "$BUILD_TARGET" ]; then
    # The installation already exists. Skip rebuilding if the version matches.
    cd "$REPO_ROOT"

    if [ "$VERSION" != "$(parse_git_branch)" ] && [ "$VERSION" != "$(parse_git_tag)" ]; then
        # The installation may exist, but the version doesn't match. Build from scratch.
        cd "$L1_SDK_ROOT"
        install
        exit 0
    fi
    # else: The version has already been built. Nothing to do.
else
    # The build target is missing. This may be the first time that the script has been run,
    # or a previous run may have failed part way through.
    install
    exit 0
fi
