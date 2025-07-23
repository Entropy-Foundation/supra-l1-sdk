import { TxnBuilderTypes } from "supra-l1-sdk-core";
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
  resource: Array<[string, ResourceInfo]>;
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
  AutomationRegistration = "AutomationRegistration",
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

export interface RawTxnJSON {
  sender: string;
  sequence_number: number;
  payload: TransactionPayloadJSON;
  max_gas_amount: number;
  gas_unit_price: number;
  expiration_timestamp_secs: number;
  chain_id: number;
}

export type TransactionPayloadJSON =
  | EntryFunctionPayloadJSON
  | AutomationRegistrationPayloadJSON
  | MultisigPayloadJSON;

export interface EntryFunctionPayloadJSON {
  EntryFunction: EntryFunctionJSON;
}

export interface EntryFunctionJSON {
  module: {
    address: string;
    name: string;
  };
  function: string;
  ty_args: Array<FunctionTypeArgs>;
  args: Array<Array<number>>;
}

export interface MultisigPayloadJSON {
  Multisig: {
    multisig_address: string;
    transaction_payload?: EntryFunctionPayloadJSON;
  };
}

export interface AutomationRegistrationPayloadJSON {
  AutomationRegistration: AutomationRegistrationParamV1JSON;
}

export interface AutomationRegistrationParamV1JSON {
  V1: {
    automated_function: EntryFunctionJSON;
    max_gas_amount: number;
    gas_price_cap: number;
    automation_fee_cap_for_epoch: number;
    expiration_timestamp_secs: number;
    aux_data: Array<Array<number>>;
  };
}

export interface Ed25519AuthenticatorJSON {
  Ed25519: {
    public_key: string;
    signature: string;
  };
}

export interface SponsorTransactionAuthenticatorJSON {
  FeePayer: {
    sender: Ed25519AuthenticatorJSON;
    secondary_signer_addresses: Array<string>;
    secondary_signers: Array<Ed25519AuthenticatorJSON>;
    fee_payer_address: string;
    fee_payer_signer: Ed25519AuthenticatorJSON;
  };
}

export interface MultiAgentTransactionAuthenticatorJSON {
  MultiAgent: {
    sender: Ed25519AuthenticatorJSON;
    secondary_signer_addresses: Array<string>;
    secondary_signers: Array<Ed25519AuthenticatorJSON>;
  };
}

export type AnyAuthenticatorJSON =
  | Ed25519AuthenticatorJSON
  | SponsorTransactionAuthenticatorJSON
  | MultiAgentTransactionAuthenticatorJSON;

export interface SendTxPayload {
  Move: {
    raw_txn: RawTxnJSON;
    authenticator: AnyAuthenticatorJSON;
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
