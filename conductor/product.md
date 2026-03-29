# Product Guide: Supra L1 SDK

## Overview
The `supra-l1-sdk` is a TypeScript SDK designed to provide a convenient and efficient way for developers to interact with the Supra Layer 1 chain. It simplifies the integration process by offering a high-level API for common blockchain operations, enhancing developer productivity and enabling the creation of robust applications on the Supra network.

## Target Audience
- Developers building decentralized applications (dApps) on the Supra network.
- Integration partners looking to connect their services with the Supra chain.
- Blockchain enthusiasts and researchers exploring the Supra ecosystem.

## Key Goals
- **Ease of Use:** Provide a simple and intuitive API for complex blockchain interactions.
- **Comprehensive Functionality:** Support all major Supra chain operations, including coin transfers, package publishing, and transaction management.
- **Type Safety:** Leverage TypeScript's type system to ensure code reliability and catch errors at compile-time.
- **Cross-Platform Compatibility:** Support both Node.js and browser environments.
- **Zero-Knowledge Security:** Guarantee that raw private keys and mnemonics are never exposed to LLMs or stored in remote logs through side-channel GUI prompts and local encrypted storage.

## Core Features
- **MCP Server:** A Model Context Protocol server that exposes secure tools for AI agents to interact with the Supra blockchain.
- **Secure Account Management:** Generate and import accounts using OS-native side-channel passphrase prompts.
- **Encrypted Local Storage:** Securely store secrets in AES-256 encrypted local PEM files.
- **RPC Node Integration:** Seamless communication with Supra RPC nodes.
- **Transaction Insights:** Retrieve detailed information about blockchain transactions.
- **Coin Transfers:** Facilitate easy and secure transfer of Supra coins.
- **Package Publishing:** Enable developers to publish smart contract packages to the network.
- **Transaction Management:** Support for transaction payload generation, simulation, signing, and hash generation.
- **Specialized Transactions:** Support for `entry_function_payload`, `script_payload`, and `automation_registration_payload` transaction types.
- **Advanced Transaction Types:** Support for sponsor transactions and multi-agent transactions.
- **Wallet Support:** Integration with Starkey wallet and other compatible wallets.

## Vision
To become the primary and most developer-friendly SDK for the Supra ecosystem, empowering a new generation of decentralized applications and services.
