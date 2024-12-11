import { TxnBuilderTypes } from 'aptos'

/**
 * Interface representing account information.
 */
/**
 * @public
 */
export interface AccountInfo {
  sequence_number: bigint
  authentication_key: string
}

/**
 * Interface representing resource information.
 */
/**
 * @public
 */
export interface ResourceInfo {
  address: string
  module: string
  name: string
  type_args: Array<{ struct: TxnBuilderTypes.StructTag }>
}

/**
 * Interface representing account resources.
 */
/**
 * @public
 */
export interface AccountResources {
  resource: Array<[string, ResourceInfo]>
  cursor: string
}

/**
 * Interface representing coin information.
 */
/**
 * @public
 */
export interface CoinInfo {
  name: string
  symbol: string
  decimals: number
}

/**
 * Enum representing transaction status.
 */
/**
 * @public
 */
export enum TransactionStatus {
  Success = 'Success',
  Failed = 'Failed',
  Pending = 'Pending'
}

/**
 * Interface representing transaction response.
 */
/**
 * @public
 */
export interface TransactionResponse {
  txHash: string
  result: TransactionStatus
}

/**
 * Enum representing transaction insight types.
 */
/**
 * @public
 */
export enum TxTypeForTransactionInsights {
  CoinTransfer = 'CoinTransfer',
  EntryFunctionCall = 'EntryFunctionCall',
  ScriptCall = 'ScriptCall'
}

/**
 * Interface representing coin change.
 */
/**
 * @public
 */
export interface CoinChange {
  coinType: string
  amount: bigint
}

/**
 * Interface representing transaction insights.
 */
/**
 * @public
 */
export interface TransactionInsights {
  coinReceiver: string
  coinChange: Array<CoinChange>
  type: TxTypeForTransactionInsights
}

/**
 * Interface representing transaction details.
 */
/**
 * @public
 */
export interface TransactionDetail {
  txHash: string
  sender: string
  sequenceNumber: number
  maxGasAmount: number
  gasUnitPrice: number
  gasUsed?: number
  transactionCost?: number
  txExpirationTimestamp?: number
  txConfirmationTime?: number
  status: TransactionStatus
  events: any
  blockNumber?: number
  blockHash?: string
  transactionInsights: TransactionInsights
  vm_status?: string
}

/**
 * Interface representing account coin transactions detail.
 */
/**
 * @public
 */
export interface AccountCoinTransactionsDetail {
  transactions: Array<TransactionDetail>
  cursor: number
}

/**
 * Interface representing entry function payload in JSON format.
 */
/**
 * @public
 */
export interface EntryFunctionPayloadJSON {
  EntryFunction: {
    module: {
      address: string
      name: string
    }
    function: string
    ty_args: Array<FunctionTypeArgs>
    args: Array<Array<number>>
  }
}

/**
 * Interface representing raw transaction in JSON format.
 */
/**
 * @public
 */
export interface RawTxnJSON {
  sender: string
  sequence_number: number
  payload: EntryFunctionPayloadJSON
  max_gas_amount: number
  gas_unit_price: number
  expiration_timestamp_secs: number
  chain_id: number
}

/**
 * Interface representing Ed25519 authenticator in JSON format.
 */
/**
 * @public
 */
export interface Ed25519AuthenticatorJSON {
  Ed25519: {
    public_key: string
    signature: string
  }
}

/**
 * Interface representing sponsor transaction authenticator in JSON format.
 */
/**
 * @public
 */
export interface SponsorTransactionAuthenticatorJSON {
  FeePayer: {
    sender: Ed25519AuthenticatorJSON
    secondary_signer_addresses: Array<string>
    secondary_signers: Array<Ed25519AuthenticatorJSON>
    fee_payer_address: string
    fee_payer_signer: Ed25519AuthenticatorJSON
  }
}

/**
 * Interface representing multi-agent transaction authenticator in JSON format.
 */
/**
 * @public
 */
export interface MultiAgentTransactionAuthenticatorJSON {
  MultiAgent: {
    sender: Ed25519AuthenticatorJSON
    secondary_signer_addresses: Array<string>
    secondary_signers: Array<Ed25519AuthenticatorJSON>
  }
}

/**
 * Type representing any authenticator in JSON format.
 */
/**
 * @public
 */
export type AnyAuthenticatorJSON =
  | Ed25519AuthenticatorJSON
  | SponsorTransactionAuthenticatorJSON
  | MultiAgentTransactionAuthenticatorJSON

/**
 * Interface representing send transaction payload.
 */
/**
 * @public
 */
export interface SendTxPayload {
  Move: {
    raw_txn: RawTxnJSON
    authenticator: AnyAuthenticatorJSON
  }
}

/**
 * Interface representing function type arguments.
 */
/**
 * @public
 */
export interface FunctionTypeArgs {
  struct: {
    address: string
    module: string
    name: string
    type_args: Array<any> // TO-DO: We need to define datatypes
  }
}

/**
 * Interface representing faucet request response.
 */
/**
 * @public
 */
export interface FaucetRequestResponse {
  status: TransactionStatus
  transactionHash: string
}

/**
 * Interface representing enable transaction wait and simulation arguments.
 */
/**
 * @public
 */
export interface EnableTransactionWaitAndSimulationArgs {
  enableWaitForTransaction?: boolean
  enableTransactionSimulation?: boolean
}

/**
 * Interface representing optional transaction payload arguments.
 */
/**
 * @public
 */
export interface OptionalTransactionPayloadArgs {
  maxGas?: bigint
  gasUnitPrice?: bigint
  txExpiryTime?: bigint
}

/**
 * Interface representing optional transaction arguments.
 */
/**
 * @public
 */
export interface OptionalTransactionArgs {
  optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
}

/**
 * Interface representing pagination arguments.
 */
/**
 * @public
 */
export interface PaginationArgs {
  count?: number
  start?: string | number
}
