# Supra L1 MCP Server

A Model Context Protocol (MCP) server for the Supra L1 SDK, allowing AI agents to interact with the Supra blockchain.

## Security Model: Zero-Knowledge & Side-Channel GUI

This server implements a **Zero-Knowledge Security Model**. Private keys and mnemonics are never shared with the LLM or stored in the conversation history. 

### How it works:
1. **Side-Channel Input**: When a tool requires a passphrase to decrypt a key, the server triggers a **GUI Popup** on your operating system (bypassing the terminal/stdio).
2. **Encrypted Storage**: Private keys are stored locally in encrypted `.pem` files using AES-256.
3. **OS Dependencies**:
   - **Linux**: Requires `zenity` installed.
   - **macOS**: Uses built-in `osascript`.
   - **Windows**: Uses built-in `PowerShell`.

## Overview

This server provides tools and resources to:
- **Securely manage accounts** without exposing secrets to AI.
- **Fund accounts** via the Supra testnet faucet.
- **Build, sign, and submit** complex Move transactions.
- **Inspect** account information and transaction insights.

## Integration with LLMs

### 1. Claude Desktop
To use this server with Claude Desktop, add it to your configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following to the `mcpServers` object:
```json
{
  "mcpServers": {
    "supra-l1": {
      "command": "node",
      "args": ["/path/to/supra-l1-sdk/packages/mcp-server/dist/index.js"]
    }
  }
}
```
*Note: Ensure you have run `npm run build` in the project root first.*

**To List Tools in Claude**:
- Click the 🔨 (hammer) icon in the chat interface.
- Or ask: *"What tools can you use from the supra-l1 server?"*

### 2. Gemini CLI
To add this server to the Gemini CLI:
```bash
gemini mcp add supra-l1 node /path/to/supra-l1-sdk/packages/mcp-server/dist/index.js
```

**To List Tools in Gemini CLI**:
- In interactive mode, type: `/tools`
- Or ask: *"List your available tools"*

## Usage

### Tools
AI agents can call these tools to perform actions.

| Tool | Description | Key Parameters |
|------|-------------|------------|
| `generate_account` | Create new account | `mnemonicPath`, `keyFilePath` |
| `import_account` | Secure existing account | `mnemonic`/`privateKey`, `keyFilePath` |
| `fund_account` | Request testnet tokens | `address`, `rpcUrl` |
| `get_balance` | Get account balance | `address`, `coinType` (optional), `rpcUrl` (optional) |
| `transfer_coin` | Transfer coins | `senderPrivateKey`, `receiverAddress`, `amount`, `coinType`, `rpcUrl` (optional) |
| `create_entry_function_tx` | Build entry function tx | `keyFilePath`, `moduleAddr`, `functionArgs` (typed) |
| `create_script_tx` | Build script tx | `keyFilePath`, `scriptCode`, `scriptArgs` (typed) |
| `sign_transaction` | Sign a raw transaction | `keyFilePath`, `serializedRawTransaction` |
| `submit_transaction` | Submit signed tx | `serializedRawTransaction`, `signature`, `rpcUrl` |
| `generate_transaction_hash` | Get tx hash | `keyFilePath`, `serializedRawTransaction` |

> **Note on `functionArgs` / `scriptArgs`**: Arguments must be typed objects, e.g., `[{"type": "address", "value": "0x..."}, {"type": "u64", "value": "1000"}]`.
### Resources
AI agents can read these resources to query blockchain state.

| URI Template | Description |
|--------------|-------------|
| `supra://account/{address}/info` | Basic information about a Supra account |
| `supra://account/{address}/resources` | All resources owned by a Supra account |
| `supra://transaction/{hash}/insights` | Detailed insights about a Supra transaction |

**To Use Resources in LLMs**:
- **Claude**: Tell the agent: *"Read the resource at supra://account/0x.../info"*
- **Gemini CLI**: Type: `/resources` to list them or simply ask: *"What are the resources on account 0x...?"*

## Setup

## Development

```bash
npm run build
npm test -w @supra-l1/mcp-server
```
