import { SupraClient, SupraAccount, HexString } from "@supra-l1/sdk";
import { McpTool } from "../server.js";

export const transferCoinTool: McpTool = {
  name: "transfer_coin",
  description: "Transfer coins from one account to another",
  inputSchema: {
    type: "object",
    properties: {
      senderPrivateKey: { type: "string", description: "Sender's private key (hex)" },
      receiverAddress: { type: "string", description: "Receiver's address (hex)" },
      amount: { type: "string", description: "Amount to transfer (as string for bigint)" },
      coinType: { type: "string", description: "Type of coin to transfer" },
      rpcUrl: { type: "string", description: "Supra RPC URL", default: "https://rpc-testnet.supra.com/" },
    },
    required: ["senderPrivateKey", "receiverAddress", "amount", "coinType"],
  },
  handler: async (args: any) => {
    const { senderPrivateKey, receiverAddress, amount, coinType, rpcUrl = "https://rpc-testnet.supra.com/" } = args;
    const supraClient = await SupraClient.init(rpcUrl);
    const senderAccount = new SupraAccount(
      Uint8Array.from(Buffer.from(senderPrivateKey.replace("0x", ""), "hex"))
    );
    const receiverAddr = new HexString(receiverAddress);
    
    const result = await supraClient.transferCoin(
      senderAccount,
      receiverAddr,
      BigInt(amount),
      coinType,
      {
        enableTransactionWaitAndSimulationArgs: {
          enableWaitForTransaction: true,
          enableTransactionSimulation: true,
        },
      }
    );
    return result;
  },
};

export const getBalanceTool: McpTool = {
  name: "get_balance",
  description: "Get the balance of a Supra account for a specific coin type",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Supra account address (hex)" },
      coinType: { type: "string", description: "Type of coin to check balance for (default: 0x1::supra_coin::SupraCoin)", default: "0x1::supra_coin::SupraCoin" },
      rpcUrl: { type: "string", description: "Supra RPC URL", default: "https://rpc-testnet.supra.com/" },
    },
    required: ["address"],
  },
  handler: async (args: any) => {
    const { address, coinType = "0x1::supra_coin::SupraCoin", rpcUrl = "https://rpc-testnet.supra.com/" } = args;
    const supraClient = await SupraClient.init(rpcUrl);
    const balance = await supraClient.getAccountCoinBalance(new HexString(address), coinType);
    return {
      address,
      coinType,
      balance: balance.toString(),
    };
  },
};
