import { TxnBuilderTypes, AptosAccount as SupraAccount, HexString } from 'aptos'

import {
  TransactionResponse,
  TransactionDetail,
  FaucetRequestResponse,
  EnableTransactionWaitAndSimulationArgs,
  OptionalTransactionArgs,
  PaginationArgs,
  AccountCoinTransactionsDetail,
  AccountInfo,
  AccountResources,
  OptionalTransactionPayloadArgs,
  CoinInfo,
  AnyAuthenticatorJSON,
  TransactionStatus
} from '../types/types'

/**
 * Interface defining the public methods of SupraClient.
 * @public
 */
export interface ISupraClient {
  /**
   * Retrieves the chain ID from the RPC node.
   * @returns Chain ID as a number.
   */
  getChainId(): Promise<number>

  /**
   * Retrieves the current mean gas price.
   * @returns Current mean gas price as bigint.
   */
  getGasPrice(): Promise<bigint>

  /**
   * Funds an account with test Supra tokens via faucet.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @returns FaucetRequestResponse.
   */
  fundAccountWithFaucet(account: HexString): Promise<FaucetRequestResponse>

  /**
   * Checks whether a given account exists on-chain.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @returns Boolean indicating account existence.
   */
  accountExists(account: HexString): Promise<boolean>

  /**
   * Retrieves account information.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @returns AccountInfo object.
   */
  getAccountInfo(account: HexString): Promise<AccountInfo>

  /**
   * Retrieves all resources held by a given account.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @param paginationArgs - Pagination arguments.
   * @returns AccountResources object.
   */
  getAccountResources(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<AccountResources>

  /**
   * Retrieves specific resource data from an account.
   * @param account - Hex-encoded 32 byte Supra account address.
   * @param resourceType - Type of the resource.
   * @returns Resource data.
   */
  getResourceData(account: HexString, resourceType: string): Promise<any>

  /**
   * Retrieves the status of a transaction.
   * @param txHash - Transaction hash.
   * @returns TransactionStatus or null.
   */
  getTransactionStatus(txHash: string): Promise<TransactionStatus | null>

  /**
   * Retrieves transaction details.
   * @param account - Account address.
   * @param txHash - Transaction hash.
   * @returns TransactionDetail or null.
   */
  getTransactionDetail(
    account: HexString,
    txHash: string
  ): Promise<TransactionDetail | null>

  /**
   * Retrieves transactions sent by the account.
   * @param account - Supra account address.
   * @param paginationArgs - Arguments for pagination.
   * @returns List of TransactionDetail.
   */
  getAccountTransactionsDetail(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<TransactionDetail[]>

  /**
   * Retrieves coin transfer related transactions associated with the account.
   * @param account - Supra account address.
   * @param paginationArgs - Arguments for pagination.
   * @returns AccountCoinTransactionsDetail.
   */
  getCoinTransactionsDetail(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<AccountCoinTransactionsDetail>

  /**
   * Transfer custom type of coin
   * @param senderAccount - Sender KeyPair
   * @param receiverAccountAddr - Receiver Supra Account address
   * @param amount - Amount to transfer
   * @param coinType - Type of custom coin
   * @param optionalTransactionArgs - Optional arguments for transaction
   * @returns `TransactionResponse`
   */
  transferCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    coinType: string,
    optionalTransactionArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse>

  /**
   * Transfer supra coin
   * @param senderAccount - Sender KeyPair
   * @param receiverAccountAddr - Receiver Supra Account address
   * @param amount - Amount to transfer
   * @param optionalTransactionArgs - Optional arguments for transaction
   * @returns `TransactionResponse`
   */
  transferSupraCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    optionalTransactionArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse>

  /**
   * Retrieves complete transactions sent by the account and coin transfer related transactions.
   * @param account - Supra account address.
   * @param count - Number of transactions to retrieve.
   * @returns List of TransactionDetail.
   */
  getAccountCompleteTransactionsDetail(
    account: HexString,
    count?: number
  ): Promise<TransactionDetail[]>

  /**
   * Get Supra balance of given account
   * @param coinType - Type of a coin resource
   * @returns CoinInfo
   */
  getCoinInfo(coinType: string): Promise<CoinInfo>

  /**
   * Retrieves SupraCoin balance of a given account.
   * @param account - SupraAccount address.
   * @returns SupraCoin balance as bigint.
   */
  getAccountSupraCoinBalance(account: HexString): Promise<bigint>

  /**
   * Retrieves custom coin balance of a given account.
   * @param account - SupraAccount address.
   * @param coinType - Type of the custom coin.
   * @returns Coin balance as bigint.
   */
  getAccountCoinBalance(account: HexString, coinType: string): Promise<bigint>

  /**
   * Invokes a view method of a smart contract.
   * @param functionFullName - Full name of the function (e.g., `0x1::module::function`).
   * @param typeArguments - Array of type arguments.
   * @param functionArguments - Array of function arguments.
   * @returns Result of the view method.
   */
  invokeViewMethod(
    functionFullName: string,
    typeArguments: Array<string>,
    functionArguments: Array<string>
  ): Promise<any>

  /**
   * Accesses an item from a table using an associated key.
   * @param tableHandle - Table handle.
   * @param keyType - Type of the key.
   * @param valueType - Type of the value.
   * @param key - The actual key.
   * @returns Table item's data.
   */
  getTableItemByKey(
    tableHandle: string,
    keyType: string,
    valueType: string,
    key: string
  ): Promise<any>

  /**
   * Publishes a package or module on the Supra network.
   * @param senderAccount - Module publisher's SupraAccount.
   * @param packageMetadata - Package metadata as Uint8Array.
   * @param modulesCode - Array of module codes as Uint8Array.
   * @param optionalArgs - Optional transaction arguments.
   * @returns TransactionResponse.
   */
  publishPackage(
    senderAccount: SupraAccount,
    packageMetadata: Uint8Array,
    modulesCode: Uint8Array[],
    optionalArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse>

  /**
   * Creates a raw transaction object.
   * @param senderAddr - Sender's HexString address.
   * @param senderSequenceNumber - Sender's sequence number.
   * @param moduleAddr - Module address.
   * @param moduleName - Module name.
   * @param functionName - Function name.
   * @param functionTypeArgs - Function type arguments.
   * @param functionArgs - Function arguments.
   * @param optionalTransactionPayloadArgs - Optional transaction payload arguments.
   * @returns RawTransaction object.
   */
  createRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Promise<TxnBuilderTypes.RawTransaction>

  /**
   * Creates a serialized raw transaction object.
   * @param senderAddr - Sender's HexString address.
   * @param senderSequenceNumber - Sender's sequence number.
   * @param moduleAddr - Module address.
   * @param moduleName - Module name.
   * @param functionName - Function name.
   * @param functionTypeArgs - Function type arguments.
   * @param functionArgs - Function arguments.
   * @param optionalTransactionPayloadArgs - Optional transaction payload arguments.
   * @returns Serialized raw transaction as Uint8Array.
   */
  createSerializedRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Promise<Uint8Array>

  /**
   * Sends a serialized raw transaction.
   * @param senderAccount - Sender's SupraAccount.
   * @param serializedRawTransaction - Serialized raw transaction data.
   * @param enableTransactionWaitAndSimulationArgs - Optional arguments for transaction simulation and wait.
   * @returns TransactionResponse.
   */
  sendTxUsingSerializedRawTransaction(
    senderAccount: SupraAccount,
    serializedRawTransaction: Uint8Array,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse>

  /**
   * Sends a serialized raw transaction with a signature.
   * @param senderPubkey - Sender's public key as HexString.
   * @param signature - Signature as HexString.
   * @param serializedRawTransaction - Serialized raw transaction data.
   * @param enableTransactionWaitAndSimulationArgs - Optional arguments for transaction simulation and wait.
   * @returns TransactionResponse.
   */
  sendTxUsingSerializedRawTransactionAndSignature(
    senderPubkey: HexString,
    signature: HexString,
    serializedRawTransaction: Uint8Array,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse>

  /**
   * Sends a sponsor transaction.
   * @param feePayerAddress - Fee payer's account address.
   * @param secondarySignersAccountAddress - List of secondary signers' account addresses.
   * @param rawTxn - RawTransaction object.
   * @param senderAuthenticator - Sender's authenticator.
   * @param feePayerAuthenticator - Fee payer's authenticator.
   * @param secondarySignersAuthenticator - List of secondary signers' authenticators.
   * @param enableTransactionWaitAndSimulationArgs - Optional arguments for transaction simulation and wait.
   * @returns TransactionResponse.
   */
  sendSponsorTransaction(
    feePayerAddress: string, // Corrected parameter name from 'feePayerAddressk' to 'feePayerAddress'
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    feePayerAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator?: Array<TxnBuilderTypes.AccountAuthenticatorEd25519>,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse>

  /**
   * Sends a multi-agent transaction.
   * @param secondarySignersAccountAddress - List of secondary signers' account addresses.
   * @param rawTxn - RawTransaction object.
   * @param senderAuthenticator - Sender's authenticator.
   * @param secondarySignersAuthenticator - List of secondary signers' authenticators.
   * @param enableTransactionWaitAndSimulationArgs - Optional arguments for transaction simulation and wait.
   * @returns TransactionResponse.
   */
  sendMultiAgentTransaction(
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator: Array<TxnBuilderTypes.AccountAuthenticatorEd25519>,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse>

  /**
   * Simulate a transaction using the provided Serialized raw transaction data
   * @param txAuthenticator - Transaction authenticator
   * @param serializedRawTransaction - Serialized raw transaction data
   * @returns Transaction simulation result
   */
  simulateTxUsingSerializedRawTransaction(
    txAuthenticator: AnyAuthenticatorJSON,
    serializedRawTransaction: Uint8Array
  ): Promise<any>
}
