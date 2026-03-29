# Specification: MCP Server Expansion - Secure Account & Transaction Tools

## Overview
This track involves expanding the `mcp-server` to include advanced account management and transaction construction capabilities. A primary requirement is a **Zero-Knowledge Security Model**: the LLM must never see or receive raw private keys or mnemonics. All sensitive inputs are handled via a side-channel GUI prompt, and secrets are stored in encrypted local files.

## Functional Requirements
- **Security Utilities**:
  - **OS-Agnostic GUI Prompts**: Detect the host OS (Linux, macOS, Windows) and use appropriate tools (`zenity`, `osascript`, `powershell`) to prompt the user for passphrases without using `stdio`.
  - **Encryption Engine**: Implement AES-256 encryption to secure private keys within `.pem` files using a user-provided passphrase.
- **Account Management**:
  - `generate_account`: 
    - Generates a new account.
    - Prompts for a passphrase via GUI.
    - Saves the mnemonic to a user-specified raw text file.
    - Saves the private key to an encrypted `.pem` file.
    - **Returns only the public address and file paths to the LLM.**
  - `fund_account`:
    - Takes a public `address` and `rpcUrl`.
    - Requests testnet tokens from the Supra faucet.
  - `import_account`: 
    - Replaces the old `derive_account`.
    - Takes a `mnemonic` or `privateKey` file path.
    - Prompts for a passphrase to encrypt and save as a new secured `.pem` file.
- **Transaction Building & Submission**:
  - Tools take a `keyFilePath` instead of a raw `privateKey`.
  - Tools prompt for the passphrase via GUI to decrypt the key in memory for signing.
  - `create_entry_function_tx` / `create_script_tx`: Serialize raw transactions.
  - `sign_transaction`: Decrypts key via prompt, signs, and returns the signature.
  - `submit_transaction`: Submits the signed transaction.

## Non-Functional Requirements
- **Zero-Knowledge**: No tool may return a mnemonic or private key in its JSON-RPC response.
- **Cross-Platform**: Support Linux (X11/Wayland), macOS, and Windows.
- **Error Handling**: Gracefully handle GUI prompt cancellations or incorrect passphrases.

## Acceptance Criteria
- [ ] LLM never receives a raw private key or mnemonic.
- [ ] `generate_account` creates two files: a mnemonic text file and an encrypted PEM file.
- [ ] Signing a transaction triggers a GUI password popup on the user's OS.
- [ ] Correct OS detection for Linux, macOS, and Windows prompts.
