# Supra TypeScript SDK

Welcome to the **Supra TypeScript SDK**! This SDK offers a streamlined and efficient way to interact with the Supra blockchain, enabling developers to perform a wide range of operations seamlessly. Designed with a clean interface and comprehensive functionalities, the Supra SDK enhances developer productivity and simplifies the integration process.

**Note:** This project is an **overhaul and cleanup by the team NLJinchuriki**, ensuring improved structure, clarity, maintainability and ease of use for developers.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Features](#features)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## Installation

Install the Supra TypeScript SDK via npm:

```bash
npm install supra-l1-sdk
```

or

```bash
yarn add supra-l1-sdk
```

or

```bash
pnpm install supra-l1-sdk
```

## Getting Started

Here's a quick example to help you get started with the Supra SDK:

```typescript
import { SupraClient } from 'supra-l1-sdk'

// Initialize the client
const client = await SupraClient.init({
  url: 'https://rpc.supra.com',
  chainId: 1 // Optional: defaults to the RPC node's chain ID
})

// To Create Instance Of Supra Client.
// Note: Here We Need To Pass ChainId, Default ChainId Value Is 3
let supraClient = new SupraClient({
  url: 'https://rpc-wallet.supra.com/',
  chainId: 3
})

// To Create Instance Of Supra Client, But In This Method We Don't Need To Pass ChainId.
// ChainId Will Be Identified At Instance Creation Time By Making RPC Call.
let supraClient = await SupraClient.init({
  url: 'https://rpc-testnet.supra.com/'
})

// Check if an account exists
const accountExists = await client.accountExists('0xYourAccountAddress')
console.log(`Account exists: ${accountExists}`)

// Transfer SupraCoin
const transactionResponse = await client.transferSupraCoin(
  senderAccount,
  '0xReceiverAddress',
  BigInt(1000)
)
console.log(`Transaction Hash: ${transactionResponse.txHash}`)
```

### Using the Built-in Logger

The Supra SDK includes a built-in **Logger** to help you manage and monitor SDK activities with different log levels. Here's how you can set it up:

```typescript
import { Logger } from 'supra-l1-sdk'

// LogTransport for extensive logging
const logTransport = (log) => {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] ${log.level}: ${log.message}`
  )
  if (log.data) {
    console.log('Data:', JSON.stringify(log.data, null, 2))
  }
}

// Creating logger with logTransport
// Set to 'DEBUG' for verbose logging output from the SDK
const logger = new Logger('INFO', logTransport)

// Initialize Supra Client with Logger
let supraClient = await SupraClient.init({
  url: 'https://rpc-testnet.supra.com/',
  logger
})
```

The **Logger** supports various log levels (`DEBUG`, `INFO`, `WARN`, `ERROR`) and allows you to define custom transport functions to handle log messages as needed.

## Features

The Supra TypeScript SDK provides a robust set of features to interact with the Supra blockchain:

### RPC Node Integration

- **Seamless Connection**: Easily connect to Supra's RPC nodes with significant `rpc_node` endpoint integration.
- **Chain ID Retrieval**: Automatically fetch the chain ID from the RPC node or specify it manually.

### Account Management

- **Account Existence Check**: Verify whether a specific account exists on-chain.
- **Retrieve Account Information**: Access detailed account information and resources.
- **Account Resources Management**: Manage and retrieve all resources held by an account.
- **Starkey Wallet Integration**: Support for integrating with Starkey wallets for enhanced security.

### Transaction Handling

- **Transaction Creation**: Generate various types of transactions, including `entry_function_payload` and `script_payload` types.
- **Transaction Signing**: Sign transactions using Ed25519 or multi-agent authenticators.
- **Transaction Simulation**: Simulate transactions to ensure successful execution before broadcasting.
- **Transaction Payload Generation**: Easily create and manage transaction payloads.
- **Transaction Hash Generation**: Derive transaction hashes locally for verification.
- **Transaction Status Monitoring**: Monitor the status of transactions in real-time.
- **Sponsor Transactions**: Support for sponsor transactions to cover gas fees.
- **Multi-Agent Transactions**: Handle transactions involving multiple agents seamlessly.

### Coin Management

- **Transfer SupraCoin**: Easily transfer SupraCoin between accounts.
- **Transfer Custom Coins**: Handle transfers of custom coin types with ease.
- **Coin Balance Retrieval**: Retrieve SupraCoin and custom coin balances for any account.
- **Coin Change Insights**: Gain insights into coin transfer events and changes.

### Smart Contract Interaction

- **Invoke View Methods**: Interact with smart contracts by invoking view methods.
- **Publish Packages**: Publish packages or modules on the Supra network.
- **Table Item Access**: Access and manage items from smart contract tables using keys.

### Logging and Error Handling

- **Integrated Logging**: Built-in logging with customizable levels (`DEBUG`, `INFO`, `WARN`, `ERROR`) and transports.
- **Comprehensive Error Handling**: Robust error handling with custom `ServiceError` classes for better debugging and reliability.

### Faucet Integration

- **Fund Accounts**: Easily fund accounts with test Supra tokens using the built-in faucet service.

## Documentation

For detailed API documentation, please visit the [TypeScript SDK Documentation](https://sdk-docs.supra.com/index.html). The documentation provides an in-depth look at all available classes, methods, interfaces, and types, ensuring you have all the information needed to leverage the full potential of the Supra SDK.

## Contributing

We welcome contributions to improve the Supra TypeScript SDK! If you encounter a bug or have a feature request, please [file an issue](https://github.com/Entropy-Foundation/supra-l1-sdk/issues). For code changes, please submit a [pull request](https://github.com/Entropy-Foundation/supra-l1-sdk/pulls) after discussing your proposed changes in an issue.

## Credits

A special thanks to the **Supra Team**, our valued contributors, and to us :P **team NLJinchuriki** for their dedication and hard work in overhauling and cleaning up this SDK

Original developers:

- [vpanchal-supra](https://github.com/vpanchal-supra)
- [supra-bharoojangid](https://github.com/supra-bharoojangid)
- [Isaac Doidge](https://github.com/isaacdoidge) - **Isaac Doidge**
- [sjadiya-supra](https://github.com/sjadiya-supra) - **Soham Jadiya**

Your work is greatly appreciated!

## License

This project is licensed under the [MIT License](LICENSE).

---

Feel free to reach out to the [Supra Community](https://community.supra.com) for support or to discuss your ideas!
