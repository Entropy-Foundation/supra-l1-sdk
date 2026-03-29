import { transferCoinTool, getBalanceTool } from "./coin.js";
import { generateAccountTool, importAccountTool, fundAccountTool } from "./account.js";
import { publishPackageTool } from "./package.js";
import {
  simulateTransactionTool,
  signTransactionTool,
  generateTransactionHashTool,
  createEntryFunctionTxTool,
  createScriptTxTool,
  submit_transaction_tool,
} from "./transaction.js";

export const tools = [
  transferCoinTool,
  getBalanceTool,
  generateAccountTool,
  importAccountTool,
  fundAccountTool,
  publishPackageTool,
  simulateTransactionTool,
  signTransactionTool,
  generateTransactionHashTool,
  createEntryFunctionTxTool,
  createScriptTxTool,
  submit_transaction_tool,
];
