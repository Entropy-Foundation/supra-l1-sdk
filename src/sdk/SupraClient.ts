import {
  TxnBuilderTypes,
  HexString,
  AptosAccount as SupraAccount,
  AnyRawTransaction,
  BCS
} from 'aptos'

import { Logger, LogLevel } from '../logger'
import { RequestService } from '../services/requestService'
import { AccountService } from '../services/accountService'
import { TransactionService } from '../services/transactionService'
import { ISupraClient } from '../interface/ISupraClient'

import {
  DEFAULT_CHAIN_ID,
  RAW_TRANSACTION_SALT,
  RAW_TRANSACTION_WITH_DATA_SALT
} from '../constants/constants'
import { DEFAULT_RPC_URL } from '../constants/hosts'

import {
  FaucetRequestResponse,
  AccountInfo,
  AccountResources,
  TransactionDetail,
  PaginationArgs,
  AccountCoinTransactionsDetail,
  TransactionResponse,
  OptionalTransactionArgs,
  OptionalTransactionPayloadArgs,
  EnableTransactionWaitAndSimulationArgs,
  CoinChange,
  CoinInfo,
  AnyAuthenticatorJSON,
  TransactionStatus
} from '../types/types'

import sha3 from 'js-sha3'

/**
 * Configuration options for SupraClient.
 */
/**
 * @public
 */
export interface SupraClientOptions {
  /**
   * RPC URL of the Supra node. If not provided, a default URL is used.
   */
  url?: string

  /**
   * Chain ID of the network. If not provided, it will be fetched from the RPC node.
   */
  chainId?: number

  /**
   * Custom RequestService instance. If not provided, a default instance is created.
   */
  /**
   * @internal
   * Custom RequestService instance. If not provided, a default instance is created.
   */
  requestService?: RequestService

  /**
   * Custom AccountService instance. If not provided, a default instance is created.
   */
  /**
   * @internal
   * Custom RequestService instance. If not provided, a default instance is created.
   */
  accountService?: AccountService

  /**
   * Custom TransactionService instance. If not provided, a default instance is created.
   */
  /**
   * @internal
   * Custom RequestService instance. If not provided, a default instance is created.
   */
  transactionService?: TransactionService

  /**
   * Logger instance. If not provided, a default logger is created.
   */
  logger?: Logger

  /**
   * Logging level. Defaults to 'WARN' if not provided.
   * Ignored if a custom logger is provided.
   */
  logLevel?: LogLevel

  /**
   * Log transport function. Ignored if a custom logger is provided.
   */
  logTransport?: (log: any) => void
}

/**
 * Provides methods for interacting with the Supra RPC node.
 */
/**
 * @public
 */
export class SupraClient implements ISupraClient {
  private requestService: RequestService
  private accountService: AccountService
  private transactionService: TransactionService
  public logger: Logger
  public chainId: TxnBuilderTypes.ChainId

  /**
   * Constructor is public to allow direct instantiation with a configuration object.
   * @param options - Configuration options for SupraClient.
   */
  constructor(options: SupraClientOptions = {}) {
    // Initialize Logger
    if (options.logger) {
      this.logger = options.logger
    } else {
      this.logger = new Logger(options.logLevel || 'WARN', options.logTransport)
    }

    // Initialize RequestService
    this.requestService =
      options.requestService ||
      new RequestService(options.url || DEFAULT_RPC_URL, this.logger)

    // Initialize AccountService
    this.accountService =
      options.accountService ||
      new AccountService(this.requestService, this.logger)

    // Initialize Chain ID
    this.chainId =
      options.chainId !== undefined
        ? new TxnBuilderTypes.ChainId(options.chainId)
        : new TxnBuilderTypes.ChainId(DEFAULT_CHAIN_ID)

    // Initialize TransactionService
    this.transactionService =
      options.transactionService ||
      new TransactionService(
        this.requestService,
        this.logger,
        this.chainId,
        this.accountService,
        SupraClient.signSupraTransaction
      )
  }

  /**
   * **Static Methods Implementation**
   */

  /**
   * Asynchronous factory method to initialize SupraClient.
   * It fetches the Chain ID from the RPC node if not provided.
   * @param options - Partial configuration options.
   * @returns Initialized SupraClient instance.
   */
  public static async init(
    options: SupraClientOptions = {}
  ): Promise<ISupraClient> {
    const client = new SupraClient(options)

    if (options.chainId === undefined) {
      try {
        const chainIdNumber = await client.getChainId()
        client.chainId = new TxnBuilderTypes.ChainId(chainIdNumber)

        client.transactionService = new TransactionService(
          client.requestService,
          client.logger,
          client.chainId,
          client.accountService,
          SupraClient.signSupraTransaction // depinject of static for signing
        )
      } catch (error) {
        client.logger.error('Failed to fetch Chain ID during initialization', {
          error
        })
        throw error
      }
    }

    return client
  }

  /**
   * Derives the transaction hash locally.
   * @param signedTransaction - SignedTransaction object.
   * @returns Transaction hash as string.
   */
  public static deriveTransactionHash(
    signedTransaction: TxnBuilderTypes.SignedTransaction
  ): string {
    return sha3.keccak256(BCS.bcsToBytes(signedTransaction))
  }

  /**
   * Generates signature message for Supra transaction using RawTransaction.
   * @param rawTxn - AnyRawTransaction object.
   * @returns Signature message as Uint8Array.
   */
  static getSupraTransactionSignatureMessage(
    rawTxn: AnyRawTransaction
  ): Uint8Array {
    let preHash = Uint8Array.from(
      Buffer.from(
        sha3.sha3_256(
          rawTxn instanceof TxnBuilderTypes.RawTransaction
            ? RAW_TRANSACTION_SALT
            : RAW_TRANSACTION_WITH_DATA_SALT
        ),
        'hex'
      )
    )

    let rawTxSerializedData = new Uint8Array(BCS.bcsToBytes(rawTxn))
    let signatureMessage = new Uint8Array(
      preHash.length + rawTxSerializedData.length
    )
    signatureMessage.set(preHash)
    signatureMessage.set(rawTxSerializedData, preHash.length)
    return signatureMessage
  }

  /**
   * Signs a Supra transaction using AnyRawTransaction.
   * @param senderAccount - Sender's SupraAccount.
   * @param rawTxn - AnyRawTransaction object.
   * @returns HexString signature.
   */
  public static signSupraTransaction(
    senderAccount: SupraAccount,
    rawTxn: AnyRawTransaction
  ): HexString {
    const signature = senderAccount.signBuffer(
      SupraClient.getSupraTransactionSignatureMessage(rawTxn)
    )
    return signature
  }

  /**
   * Signs a multi-agent transaction and returns the signer authenticator.
   * @param signer - Signer account.
   * @param rawTxn - MultiAgentRawTransaction or FeePayerRawTransaction.
   * @returns AccountAuthenticatorEd25519.
   */
  public static signSupraMultiTransaction(
    signer: SupraAccount,
    rawTxn:
      | TxnBuilderTypes.MultiAgentRawTransaction
      | TxnBuilderTypes.FeePayerRawTransaction
  ): TxnBuilderTypes.AccountAuthenticatorEd25519 {
    const signerSignature = new TxnBuilderTypes.Ed25519Signature(
      SupraClient.signSupraTransaction(signer, rawTxn).toUint8Array()
    )
    const signerAuthenticator = new TxnBuilderTypes.AccountAuthenticatorEd25519(
      new TxnBuilderTypes.Ed25519PublicKey(signer.pubKey().toUint8Array()),
      signerSignature
    )

    return signerAuthenticator
  }

  /**
   * Retrieves the chain ID from the RPC node.
   * @returns Chain ID as a number.
   */
  public async getChainId(): Promise<number> {
    try {
      const response = await this.requestService.sendRequest<number>(
        '/rpc/v1/transactions/chain_id',
        undefined,
        'GET'
      )
      return Number(response.data)
    } catch (error) {
      throw error
    }
  }

  /**
   * Creates a signed transaction payload.
   * @param senderAccount - Sender's SupraAccount.
   * @param rawTxn - RawTransaction object.
   * @returns SignedTransaction object.
   */
  public static createSignedTransaction(
    senderAccount: SupraAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ): TxnBuilderTypes.SignedTransaction {
    return new TxnBuilderTypes.SignedTransaction(
      rawTxn,
      new TxnBuilderTypes.AccountAuthenticatorEd25519(
        new TxnBuilderTypes.Ed25519PublicKey(
          senderAccount.pubKey().toUint8Array()
        ),
        new TxnBuilderTypes.Ed25519Signature(
          SupraClient.signSupraTransaction(senderAccount, rawTxn).toUint8Array()
        )
      )
    )
  }

  /* -- end static *--/

  /**
   * Retrieves the current mean gas price.
   * @returns Current mean gas price as bigint.
   */
  public async getGasPrice(): Promise<bigint> {
    try {
      const response = await this.requestService.sendRequest<any>(
        '/rpc/v1/transactions/estimate_gas_price',
        undefined,
        'GET'
      )
      return BigInt(response.data.mean_gas_price)
    } catch (error) {
      this.logger.error('Failed to fetch gas price', { error })
      throw error
    }
  }

  public async fundAccountWithFaucet(
    account: HexString
  ): Promise<FaucetRequestResponse> {
    return this.transactionService.fundAccountWithFaucet(account)
  }

  public async accountExists(account: HexString): Promise<boolean> {
    return this.accountService.accountExists(account)
  }

  public async getAccountInfo(account: HexString): Promise<AccountInfo> {
    return this.accountService.getAccountInfo(account)
  }

  public async getAccountResources(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<AccountResources> {
    return this.accountService.getAccountResources(account, paginationArgs)
  }

  public async getResourceData(
    account: HexString,
    resourceType: string
  ): Promise<any> {
    // TO-DO: We need to define return types for these respones
    return this.accountService.getResourceData(account, resourceType)
  }

  public async getTransactionStatus(
    txHash: string
  ): Promise<TransactionStatus | null> {
    return this.transactionService.getTransactionStatus(txHash)
  }

  public getCoinChangeAmount(
    userAddress: string,
    events: any[] //  TO-DO:   We need to define return types for these responses
  ): Array<CoinChange> {
    return this.transactionService.getCoinChangeAmount(userAddress, events)
  }

  public async getTransactionDetail(
    account: HexString,
    txHash: string
  ): Promise<TransactionDetail | null> {
    return this.transactionService.getTransactionDetail(account, txHash)
  }

  public async getAccountTransactionsDetail(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<TransactionDetail[]> {
    return this.transactionService.getAccountTransactionsDetail(
      account,
      paginationArgs
    )
  }

  public async getCoinTransactionsDetail(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<AccountCoinTransactionsDetail> {
    return this.transactionService.getCoinTransactionsDetail(
      account,
      paginationArgs
    )
  }

  public async getAccountCompleteTransactionsDetail(
    account: HexString,
    count?: number
  ): Promise<TransactionDetail[]> {
    return this.transactionService.getAccountCompleteTransactionsDetail(
      account,
      count
    )
  }

  async transferCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    coinType: string,
    optionalTransactionArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    return this.transactionService.transferCoin(
      senderAccount,
      receiverAccountAddr,
      amount,
      coinType,
      optionalTransactionArgs
    )
  }

  async transferSupraCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    optionalTransactionArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    return this.transactionService.transferSupraCoin(
      senderAccount,
      receiverAccountAddr,
      amount,
      optionalTransactionArgs
    )
  }

  public async getCoinInfo(coinType: string): Promise<CoinInfo> {
    return this.transactionService.getCoinInfo(coinType)
  }

  public async getAccountSupraCoinBalance(account: HexString): Promise<bigint> {
    return this.accountService.getAccountSupraCoinBalance(account)
  }

  public async getAccountCoinBalance(
    account: HexString,
    coinType: string
  ): Promise<bigint> {
    return this.accountService.getAccountCoinBalance(account, coinType)
  }

  public async invokeViewMethod(
    functionFullName: string,
    typeArguments: Array<string>,
    functionArguments: Array<string>
  ): Promise<any> {
    //  TO-DO:   We need to define return types for these responses
    return this.transactionService.invokeViewMethod(
      functionFullName,
      typeArguments,
      functionArguments
    )
  }

  public async getTableItemByKey(
    tableHandle: string,
    keyType: string,
    valueType: string,
    key: string
  ): Promise<any> {
    //  TO-DO:   We need to define return types for these responses
    return this.transactionService.getTableItemByKey(
      tableHandle,
      keyType,
      valueType,
      key
    )
  }

  public async sendTxUsingSerializedRawTransaction(
    senderAccount: SupraAccount,
    serializedRawTransaction: Uint8Array,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    return this.transactionService.sendTxUsingSerializedRawTransaction(
      senderAccount,
      serializedRawTransaction,
      enableTransactionWaitAndSimulationArgs
    )
  }

  public async sendSponsorTransaction(
    feePayerAddress: string,
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    feePayerAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator: Array<TxnBuilderTypes.AccountAuthenticatorEd25519> = [],
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    return this.transactionService.sendSponsorTransaction(
      feePayerAddress,
      secondarySignersAccountAddress,
      rawTxn,
      senderAuthenticator,
      feePayerAuthenticator,
      secondarySignersAuthenticator,
      enableTransactionWaitAndSimulationArgs
    )
  }

  public async sendMultiAgentTransaction(
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator: Array<TxnBuilderTypes.AccountAuthenticatorEd25519>,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    return this.transactionService.sendMultiAgentTransaction(
      secondarySignersAccountAddress,
      rawTxn,
      senderAuthenticator,
      secondarySignersAuthenticator,
      enableTransactionWaitAndSimulationArgs
    )
  }

  public async createRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Promise<TxnBuilderTypes.RawTransaction> {
    return this.transactionService.createRawTxObject(
      senderAddr,
      senderSequenceNumber,
      moduleAddr,
      moduleName,
      functionName,
      functionTypeArgs,
      functionArgs,
      optionalTransactionPayloadArgs
    )
  }

  public async createSerializedRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Promise<Uint8Array> {
    return this.transactionService.createSerializedRawTxObject(
      senderAddr,
      senderSequenceNumber,
      moduleAddr,
      moduleName,
      functionName,
      functionTypeArgs,
      functionArgs,
      optionalTransactionPayloadArgs
    )
  }

  public async publishPackage(
    senderAccount: SupraAccount,
    packageMetadata: Uint8Array,
    modulesCode: Uint8Array[],
    optionalArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    return this.transactionService.publishPackage(
      senderAccount,
      packageMetadata,
      modulesCode,
      optionalArgs
    )
  }

  async sendTxUsingSerializedRawTransactionAndSignature(
    senderPubkey: HexString,
    signature: HexString,
    serializedRawTransaction: Uint8Array,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    return this.transactionService.sendTxUsingSerializedRawTransactionAndSignature(
      senderPubkey,
      signature,
      serializedRawTransaction,
      enableTransactionWaitAndSimulationArgs
    )
  }

  async simulateTxUsingSerializedRawTransaction(
    txAuthenticator: AnyAuthenticatorJSON,
    serializedRawTransaction: Uint8Array
  ): Promise<any> {
    return this.transactionService.simulateTxUsingSerializedRawTransaction(
      txAuthenticator,
      serializedRawTransaction
    )
  }
}
