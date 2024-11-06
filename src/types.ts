import { TxnBuilderTypes } from "aptos";
export interface AccountInfo {
  sequence_number: bigint;
  authentication_key: string;
}

export interface ResourceInfo {
  address: string;
  module: string;
  name: string;
  type_args: Array<{ struct: TxnBuilderTypes.StructTag }>;
}

export interface AccountResources {
  resources: Array<[string, ResourceInfo]>;
  cursor: string;
}

export interface CoinInfo {
  name: string;
  symbol: string;
  decimals: number;
}

export enum TransactionStatus {
  Success = "Success",
  Failed = "Failed",
  Pending = "Pending",
}

export interface TransactionResponse {
  txHash: string;
  result: TransactionStatus;
}

export enum TxTypeForTransactionInsights {
  CoinTransfer = "CoinTransfer",
  EntryFunctionCall = "EntryFunctionCall",
  ScriptCall = "ScriptCall",
}

export interface CoinChange {
  coinType: string;
  amount: bigint;
}

export interface TransactionInsights {
  coinReceiver: string;
  coinChange: Array<CoinChange>;
  type: TxTypeForTransactionInsights;
}

export interface TransactionDetail {
  txHash: string;
  sender: string;
  sequenceNumber: number;
  maxGasAmount: number;
  gasUnitPrice: number;
  gasUsed?: number;
  transactionCost?: number;
  txExpirationTimestamp?: number;
  txConfirmationTime?: number;
  status: TransactionStatus;
  events: any;
  blockNumber?: number;
  blockHash?: string;
  transactionInsights: TransactionInsights;
  vm_status?: string;
}

export interface AccountCoinTransactionsDetail {
  transactions: Array<TransactionDetail>;
  cursor: number;
}

export interface SendTxPayload {
  Move: {
    raw_txn: {
      sender: string;
      sequence_number: number;
      payload: {
        EntryFunction: {
          module: {
            address: string;
            name: string;
          };
          function: string;
          ty_args: Array<FunctionTypeArgs>;
          args: Array<Array<number>>;
        };
      };
      max_gas_amount: number;
      gas_unit_price: number;
      expiration_timestamp_secs: number;
      chain_id: number;
    };
    authenticator: {
      Ed25519: {
        public_key: string;
        signature: string;
      };
    };
  };
}

export interface FunctionTypeArgs {
  struct: {
    address: string;
    module: string;
    name: string;
    type_args: Array<any>;
  };
}

export interface FaucetRequestResponse {
  status: TransactionStatus;
  transactionHash: string;
}

export interface EnableTransactionWaitAndSimulationArgs {
  enableWaitForTransaction?: boolean;
  enableTransactionSimulation?: boolean;
}

export interface OptionalTransactionPayloadArgs {
  maxGas?: bigint;
  gasUnitPrice?: bigint;
  txExpiryTime?: bigint;
}

export interface OptionalTransactionArgs {
  optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs;
  enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs;
}

export interface PaginationArgs {
  count?: number;
  start?: string | number;
}
