import { SupraClient, HexString } from "@supra-l1/sdk";
import { McpResource } from "../server.js";

const RPC_URL = "https://rpc-testnet.supra.com/";

export const accountInfoResource: McpResource = {
  uri: "supra://account/{address}/info",
  name: "Account Info",
  description: "Basic information about a Supra account",
  mimeType: "application/json",
  read: async (uri: string) => {
    const match = uri.match(/supra:\/\/account\/(0x[a-fA-F0-9]+)\/info/);
    if (!match) {
      throw new Error(`Invalid account info URI: ${uri}`);
    }
    const address = match[1];
    const supraClient = await SupraClient.init(RPC_URL);
    const info = await supraClient.getAccountInfo(new HexString(address));
    return JSON.stringify(info, null, 2);
  },
};

export const accountResourcesResource: McpResource = {
  uri: "supra://account/{address}/resources",
  name: "Account Resources",
  description: "All resources owned by a Supra account",
  mimeType: "application/json",
  read: async (uri: string) => {
    const match = uri.match(/supra:\/\/account\/(0x[a-fA-F0-9]+)\/resources/);
    if (!match) {
      throw new Error(`Invalid account resources URI: ${uri}`);
    }
    const address = match[1];
    const supraClient = await SupraClient.init(RPC_URL);
    const resources = await supraClient.getAccountResources(new HexString(address));
    return JSON.stringify(resources, null, 2);
  },
};
