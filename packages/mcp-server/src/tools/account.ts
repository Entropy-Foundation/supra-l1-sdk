import { SupraAccount, SupraClient, HexString } from "@supra-l1/sdk";
import { McpTool } from "../server.js";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import * as fs from 'fs';
import { getPassphrase, encrypt, decrypt } from '../utils/security.js';

export const generateAccountTool: McpTool = {
  name: "generate_account",
  description: "Generate a new Supra account and save secrets to files",
  inputSchema: {
    type: "object",
    properties: {
      mnemonicPath: { type: "string", description: "Path to save the raw mnemonic text file" },
      keyFilePath: { type: "string", description: "Path to save the encrypted private key PEM file" },
    },
    required: ["mnemonicPath", "keyFilePath"],
  },
  handler: async (args: any) => {
    const { mnemonicPath, keyFilePath } = args;
    
    // Get passphrase via side-channel GUI
    const passphrase = getPassphrase("Enter passphrase to encrypt your new private key");
    if (!passphrase) {
      throw new Error("Passphrase is required to secure the account");
    }

    const mnemonic = bip39.generateMnemonic(wordlist);
    const path = "m/44'/637'/0'/0'/0'";
    const account = SupraAccount.fromDerivePath(path, mnemonic);
    const accountObj = account.toPrivateKeyObject();
    
    // Encrypt private key
    const encryptedKey = encrypt(accountObj.privateKeyHex, passphrase);

    // Save to files
    fs.writeFileSync(mnemonicPath, mnemonic);
    fs.writeFileSync(keyFilePath, encryptedKey);
    
    return {
      address: accountObj.address,
      publicKey: accountObj.publicKeyHex,
      mnemonicPath: mnemonicPath,
      keyFilePath: keyFilePath,
      message: "Account generated successfully. Secrets saved to local files. LLM does not have access to them."
    };
  },
};

export const importAccountTool: McpTool = {
  name: "import_account",
  description: "Import an existing mnemonic or private key and save as encrypted PEM",
  inputSchema: {
    type: "object",
    properties: {
      mnemonic: { type: "string", description: "Account mnemonic (optional if privateKey provided)" },
      privateKey: { type: "string", description: "Account private key hex (optional if mnemonic provided)" },
      keyFilePath: { type: "string", description: "Path to save the encrypted private key PEM file" },
      derivationPath: { type: "string", description: "BIP44 derivation path", default: "m/44'/637'/0'/0'/0'" },
    },
    required: ["keyFilePath"],
  },
  handler: async (args: any) => {
    const { mnemonic, privateKey, keyFilePath, derivationPath = "m/44'/637'/0'/0'/0'" } = args;
    let account: SupraAccount;

    if (mnemonic) {
      account = SupraAccount.fromDerivePath(derivationPath, mnemonic);
    } else if (privateKey) {
      account = new SupraAccount(
        Uint8Array.from(Buffer.from(privateKey.replace("0x", ""), "hex"))
      );
    } else {
      throw new Error("Either mnemonic or privateKey must be provided");
    }

    // Get passphrase via side-channel GUI
    const passphrase = getPassphrase("Enter passphrase to encrypt and save this account");
    if (!passphrase) {
      throw new Error("Passphrase is required to secure the account");
    }

    const accountObj = account.toPrivateKeyObject();
    const encryptedKey = encrypt(accountObj.privateKeyHex, passphrase);
    fs.writeFileSync(keyFilePath, encryptedKey);

    return {
      address: accountObj.address,
      publicKey: accountObj.publicKeyHex,
      keyFilePath: keyFilePath,
      message: "Account imported and saved to encrypted PEM file."
    };
  },
};

export const fundAccountTool: McpTool = {
  name: "fund_account",
  description: "Request testnet tokens from the Supra faucet for a given address",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Supra account address (hex)" },
      rpcUrl: { type: "string", description: "Supra RPC URL" },
    },
    required: ["address", "rpcUrl"],
  },
  handler: async (args: any) => {
    const { address, rpcUrl } = args;
    const supraClient = await SupraClient.init(rpcUrl);
    const result = await supraClient.fundAccountWithFaucet(new HexString(address));
    return result;
  },
};
