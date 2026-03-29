import { SupraClient, SupraAccount } from "@supra-l1/sdk";
import { McpTool } from "../server.js";

export const publishPackageTool: McpTool = {
  name: "publish_package",
  description: "Publish a package or module on the Supra network",
  inputSchema: {
    type: "object",
    properties: {
      senderPrivateKey: { type: "string", description: "Sender's private key (hex)" },
      packageMetadata: { type: "string", description: "Package metadata (hex)" },
      modulesCode: { type: "array", items: { type: "string" }, description: "Array of module codes (hex)" },
      rpcUrl: { type: "string", description: "Supra RPC URL", default: "https://rpc-testnet.supra.com/" },
    },
    required: ["senderPrivateKey", "packageMetadata", "modulesCode"],
  },
  handler: async (args: any) => {
    const { senderPrivateKey, packageMetadata, modulesCode, rpcUrl = "https://rpc-testnet.supra.com/" } = args;
    const supraClient = await SupraClient.init(rpcUrl);
    const senderAccount = new SupraAccount(
      Uint8Array.from(Buffer.from(senderPrivateKey.replace("0x", ""), "hex"))
    );
    
    const metadataBytes = Uint8Array.from(Buffer.from(packageMetadata.replace("0x", ""), "hex"));
    const modulesBytes = modulesCode.map((code: string) => 
      Uint8Array.from(Buffer.from(code.replace("0x", ""), "hex"))
    );
    
    const result = await supraClient.publishPackage(
      senderAccount,
      metadataBytes,
      modulesBytes,
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
