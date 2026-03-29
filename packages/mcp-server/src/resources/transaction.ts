import { SupraClient } from "@supra-l1/sdk";
import { McpResource } from "../server.js";

const RPC_URL = "https://rpc-testnet.supra.com/";

export const transactionInsightsResource: McpResource = {
  uri: "supra://transaction/{hash}/insights",
  name: "Transaction Insights",
  description: "Detailed insights about a Supra transaction",
  mimeType: "application/json",
  read: async (uri: string) => {
    const match = uri.match(/supra:\/\/transaction\/(0x[a-fA-F0-9]+)\/insights/);
    if (!match) {
      throw new Error(`Invalid transaction insights URI: ${uri}`);
    }
    const hash = match[1];
    const supraClient = await SupraClient.init(RPC_URL);
    const txDetail = await supraClient.getTransactionDetail(hash);
    if (!txDetail) {
      throw new Error(`Transaction not found: ${hash}`);
    }
    const insights = supraClient.getTransactionInsights(txDetail.sender, txDetail);
    return JSON.stringify(insights, null, 2);
  },
};
