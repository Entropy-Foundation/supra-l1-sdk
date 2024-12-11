import {
  HexString,
  TxnBuilderTypes,
  BCS,
  AptosAccount as SupraAccount
} from 'aptos'
import {
  TransactionDetail,
  TransactionStatus,
  SendTxPayload,
  TransactionResponse,
  PaginationArgs,
  OptionalTransactionArgs,
  AccountCoinTransactionsDetail,
  TransactionInsights,
  OptionalTransactionPayloadArgs,
  CoinChange,
  RawTxnJSON,
  CoinInfo,
  EnableTransactionWaitAndSimulationArgs,
  Ed25519AuthenticatorJSON,
  FaucetRequestResponse,
  TxTypeForTransactionInsights,
  AnyAuthenticatorJSON
} from '../types/types'

import { ServiceError } from '../error'
import type { Logger } from '../logger'
import {
  parseFunctionTypeArgs,
  fromUint8ArrayToJSArray,
  sleep,
  normalizeAddress
} from '../utils/helpers'

import {
  DEFAULT_ENABLE_SIMULATION,
  DEFAULT_MAX_GAS_UNITS,
  DEFAULT_GAS_PRICE,
  DEFAULT_RECORDS_ITEMS_COUNT,
  DEFAULT_TX_EXPIRATION_DURATION,
  DEFAULT_WAIT_FOR_TX_COMPLETION,
  DELAY_BETWEEN_POOLING_REQUEST,
  MAX_RETRY_FOR_TRANSACTION_COMPLETION,
  MILLISECONDS_PER_SECOND,
  SUPRA_FRAMEWORK_ADDRESS,
  DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_EXISTS,
  DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_NOT_EXISTS
} from '../constants/constants'
import type { AccountService } from './accountService'
import type { RequestService } from './requestService'

/**
 * Service responsible for transaction-related operations.
 */
export class TransactionService {
  private requestService: RequestService
  private logger: Logger
  private chainId: TxnBuilderTypes.ChainId
  private accountService: AccountService
  private signSupraTransaction: (
    senderAccount: SupraAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ) => HexString

  /**
   * Constructs a TransactionService instance.
   * @param requestService - Instance of RequestService.
   * @param logger - Logger instance for logging.
   * @param chainId - Chain ID of the network.
   * @param accountService - Instance of AccountService.
   */
  constructor(
    requestService: RequestService,
    logger: Logger,
    chainId: TxnBuilderTypes.ChainId,
    accountService: AccountService,
    signSupraTransaction: (
      senderAccount: SupraAccount,
      rawTxn: TxnBuilderTypes.RawTransaction
    ) => HexString
  ) {
    this.requestService = requestService
    this.logger = logger
    this.chainId = chainId
    this.accountService = accountService
    this.signSupraTransaction = signSupraTransaction
  }

  /**
   * Sends a transaction payload to the Supra RPC node.
   * @param sendTxPayload - Transaction payload.
   * @param enableArgs - Optional arguments to enable wait and simulation.
   * @returns TransactionResponse.
   */
  public async sendTx(
    sendTxPayload: SendTxPayload,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    try {
      if (
        (enableTransactionWaitAndSimulationArgs?.enableTransactionSimulation ??
          DEFAULT_ENABLE_SIMULATION) === true
      ) {
        await this.simulateTx(sendTxPayload)
      }

      const response = await this.requestService.sendRequest<string>(
        '/rpc/v1/transactions/submit',
        sendTxPayload,
        'POST'
      )

      this.logger.info('Transaction Request Sent, Waiting For Completion')

      const txHash: string = response.data
      const result: TransactionStatus =
        (enableTransactionWaitAndSimulationArgs?.enableWaitForTransaction ??
          DEFAULT_WAIT_FOR_TX_COMPLETION) === true
          ? await this.waitForTransactionCompletion(response.data)
          : TransactionStatus.Pending

      return {
        txHash,
        result
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error
      }
      throw new ServiceError('Failed to send transaction', error as Error)
    }
  }

  /**
   * Waits for a transaction to complete by polling its status.
   * @param txHash - Transaction hash.
   * @returns TransactionStatus.
   * @throws ServiceError if the transaction fails or exceeds maximum retries.
   */
  public async waitForTransactionCompletion(
    txHash: string
  ): Promise<TransactionStatus> {
    for (
      let attempt = 1;
      attempt < MAX_RETRY_FOR_TRANSACTION_COMPLETION;
      attempt++
    ) {
      try {
        const txStatus = await this.getTransactionStatus(txHash)
        if (
          txStatus === TransactionStatus.Success ||
          txStatus === TransactionStatus.Failed
        ) {
          return txStatus
        }
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt}/${MAX_RETRY_FOR_TRANSACTION_COMPLETION}: Failed to fetch transaction status for ${txHash}.`,
          { error }
        )
      }

      if (attempt < MAX_RETRY_FOR_TRANSACTION_COMPLETION) {
        await sleep(DELAY_BETWEEN_POOLING_REQUEST)
      }
    }

    this.logger.error(
      `Transaction ${txHash} did not complete within the maximum retry limit.`
    )
    throw new ServiceError(
      `Transaction ${txHash} did not complete within the maximum retry limit.`,
      new Error('MAX_RETRIES_EXCEEDED')
    )
  }

  /**
   * Retrieves the status of a transaction.
   * @param txHash - Transaction hash.
   * @returns TransactionStatus or null.
   */
  public async getTransactionStatus(
    txHash: string
  ): Promise<TransactionStatus | null> {
    try {
      const response = await this.requestService.sendRequest<any>( //  TO-DO:   We need to define return types for these responses
        `/rpc/v1/transactions/${txHash}`
      )
      if (response.data == null) {
        return null
      }

      const statusMap: Record<string, TransactionStatus> = {
        Success: TransactionStatus.Success,
        Fail: TransactionStatus.Failed,
        Pending: TransactionStatus.Pending
      }

      return statusMap[response.data.status] || TransactionStatus.Pending
    } catch (error) {
      this.logger.error('Failed to fetch transaction status', { error })
      return null
    }
  }

  /**
   * Simulates a transaction to ensure it will execute successfully.
   * @param sendTxPayload - Transaction payload.
   */
  public async simulateTx(sendTxPayload: SendTxPayload): Promise<any> {
    //  TO-DO:   We need to define return types for these responses
    try {
      let txAuthenticatorWithValidSignatures = sendTxPayload.Move.authenticator
      let txAuthenticatorClone = JSON.parse(
        JSON.stringify(txAuthenticatorWithValidSignatures)
      )
      sendTxPayload.Move.authenticator = txAuthenticatorClone
      this.unsetAuthenticatorSignatures(sendTxPayload.Move.authenticator)
      const response = await this.requestService.sendRequest(
        '/rpc/v1/transactions/simulate',
        sendTxPayload,
        'POST'
      )

      sendTxPayload.Move.authenticator = txAuthenticatorWithValidSignatures
      if (response.data.output.Move.vm_status !== 'Executed successfully') {
        throw new Error(
          'Transaction Failed, Reason: ' + response.data.output.Move.vm_status
        )
      }
      this.logger.info('Transaction Simulation Done')
      return response.data
    } catch (error) {
      this.logger.error('Failed to simulate transaction', { error })
      throw error
    }
  }

  /**
   * Simulate a transaction using the provided Serialized raw transaction data
   * @param senderAccountAddress - Tx sender account address
   * @param txAuthenticator -Transaction authenticator
   * @param serializedRawTransaction - Serialized raw transaction data
   * @returns Transaction simulation result
   */
  async simulateTxUsingSerializedRawTransaction(
    txAuthenticator: AnyAuthenticatorJSON,
    serializedRawTransaction: Uint8Array
  ): Promise<any> {
    let sendTxPayload = {
      Move: {
        raw_txn: this.getRawTxnJSON(
          TxnBuilderTypes.RawTransaction.deserialize(
            new BCS.Deserializer(serializedRawTransaction)
          )
        ),
        authenticator: txAuthenticator
      }
    }

    return await this.simulateTx(sendTxPayload)
  }

  /**
   * Removes signatures from the authenticator for simulation purposes.
   * @param txAuthenticator - Transaction authenticator.
   */
  private unsetAuthenticatorSignatures(
    txAuthenticator: any // Replace with appropriate type
  ): void {
    const nullSignature = '0x' + '0'.repeat(128)
    if ('Ed25519' in txAuthenticator) {
      txAuthenticator.Ed25519.signature = nullSignature
    } else if ('FeePayer' in txAuthenticator) {
      txAuthenticator.FeePayer.sender.Ed25519.signature = nullSignature
      txAuthenticator.FeePayer.fee_payer_signer.Ed25519.signature =
        nullSignature
      txAuthenticator.FeePayer.secondary_signers.forEach((auth: any) => {
        // TO-DO: We need to define datatypes
        auth.Ed25519.signature = nullSignature
      })
    } else if ('MultiAgent' in txAuthenticator) {
      txAuthenticator.MultiAgent.sender.Ed25519.signature = nullSignature
      txAuthenticator.MultiAgent.secondary_signers.forEach((auth: any) => {
        // TO-DO: We need to define datatypes
        auth.Ed25519.signature = nullSignature
      })
    }
  }

  /**
   * Retrieves transaction details.
   * @param account - Account address.
   * @param txHash - Transaction hash.
   * @returns TransactionDetail or null.
   */
  public async getTransactionDetail(
    account: HexString,
    txHash: string
  ): Promise<TransactionDetail | null> {
    try {
      const response = await this.requestService.sendRequest<any>(
        `/rpc/v1/transactions/${txHash}`
      )

      const data = response.data
      if (!data) return null

      const isPendingOrIncomplete =
        data.status === 'Pending' || !data.output || !data.header

      const baseDetail: Partial<TransactionDetail> = {
        txHash,
        sender: data.header.sender.Move,
        sequenceNumber: data.header.sequence_number,
        maxGasAmount: data.header.max_gas_amount,
        gasUnitPrice: data.header.gas_unit_price,
        txExpirationTimestamp: Number(
          data.header.expiration_timestamp.microseconds_since_unix_epoch
        ),
        transactionInsights: this.getTransactionInsights(
          account.toString(),
          data
        ),
        status: data.status
      }

      if (isPendingOrIncomplete) {
        return {
          ...baseDetail,
          gasUsed: undefined,
          transactionCost: undefined,
          txConfirmationTime: undefined,
          events: undefined,
          blockNumber: undefined,
          blockHash: undefined,
          vm_status: undefined
        } as TransactionDetail
      }

      return {
        ...baseDetail,
        gasUsed: data.output.Move.gas_used,
        transactionCost:
          data.header.gas_unit_price * (data.output.Move.gas_used || 0),
        txConfirmationTime: Number(
          data.block_header.timestamp.microseconds_since_unix_epoch
        ),
        events: data.output.Move.events,
        blockNumber: data.block_header.height,
        blockHash: data.block_header.hash,
        vm_status: data.output.Move.vm_status
      } as TransactionDetail
    } catch (error) {
      this.logger.error('Failed to get transaction detail', { error })
      throw new ServiceError('Failed to get transaction detail', error as Error)
    }
  }

  /**
   * Retrieves coin transfer related transactions associated with the account.
   * @param account - Supra account address.
   * @param paginationArgs - Arguments for pagination.
   * @returns AccountCoinTransactionsDetail.
   */
  public async getCoinTransactionsDetail(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<AccountCoinTransactionsDetail> {
    try {
      const count = paginationArgs?.count ?? DEFAULT_RECORDS_ITEMS_COUNT
      const start = paginationArgs?.start
        ? `&start=${paginationArgs.start}`
        : ''

      const response = await this.requestService.sendRequest<any>( //  TO-DO:   We need to define return types for these responses
        `/rpc/v1/accounts/${account.toString()}/coin_transactions?count=${count}${start}`
      )

      if (response.data.record == null) {
        throw new ServiceError(
          'Account does not exist or invalid account provided.',
          new Error('No transaction data')
        )
      }

      let coinTransactionsDetail: TransactionDetail[] = []
      response.data.record.forEach((data: any) => {
        //  TO-DO:  We need to define data types
        coinTransactionsDetail.push({
          txHash: data.hash,
          sender: data.header.sender.Move,
          sequenceNumber: data.header.sequence_number,
          maxGasAmount: data.header.max_gas_amount,
          gasUnitPrice: data.header.gas_unit_price,
          gasUsed: data.output.Move.gas_used,
          transactionCost:
            data.header.gas_unit_price * data.output.Move.gas_used,
          txExpirationTimestamp: Number(
            data.header.expiration_timestamp.microseconds_since_unix_epoch
          ),
          txConfirmationTime: Number(
            data.block_header.timestamp.microseconds_since_unix_epoch
          ),
          status:
            data.status === 'Fail' || data.status === 'Invalid'
              ? TransactionStatus.Failed
              : data.status,
          events: data.output.Move.events,
          blockNumber: data.block_header.height,
          blockHash: data.block_header.hash,
          transactionInsights: this.getTransactionInsights(
            account.toString(),
            data
          ),
          vm_status: data.output.Move.vm_status
        })
      })
      return {
        transactions: coinTransactionsDetail,
        cursor: response.data.cursor
      }
    } catch (error) {
      this.logger.error('Failed to fetch coin transactions detail', { error })
      throw new ServiceError(
        'Failed to fetch coin transactions detail',
        error as Error
      )
    }
  }

  /**
   * Retrieves complete transactions sent by the account and coin transfer related transactions.
   * @param account - Supra account address.
   * @param count - Number of transactions to retrieve.
   * @returns List of TransactionDetail.
   */
  public async getAccountCompleteTransactionsDetail(
    account: HexString,
    count: number = DEFAULT_RECORDS_ITEMS_COUNT
  ): Promise<TransactionDetail[]> {
    try {
      const coinTransactions = await this.requestService.sendRequest<any>( //  TO-DO:   We need to define return types for these responses
        `/rpc/v1/accounts/${account.toString()}/coin_transactions?count=${count}`
      )
      const accountSentTransactions =
        await this.requestService.sendRequest<any>( //  TO-DO:   We need to define return types for these responses
          `/rpc/v1/accounts/${account.toString()}/transactions?count=${count}`
        )

      let combinedTxArray: any[] = [] // TO-DO: We need to define datatypes
      if (coinTransactions.data.record != null) {
        combinedTxArray.push(...coinTransactions.data.record)
      }
      if (accountSentTransactions.data.record != null) {
        combinedTxArray.push(...accountSentTransactions.data.record)
      }

      // Remove duplicates based on transaction hash
      let combinedTx = combinedTxArray.filter(
        (item, index, self) =>
          index === self.findIndex((data) => data.hash === item.hash)
      )
      // Sort transactions by timestamp descending
      combinedTx.sort((a, b) => {
        if (
          a.block_header.timestamp.microseconds_since_unix_epoch <
          b.block_header.timestamp.microseconds_since_unix_epoch
        ) {
          return 1
        } else {
          return -1
        }
      })

      let combinedTxDetail: TransactionDetail[] = []
      combinedTx.forEach((data: any) => {
        combinedTxDetail.push({
          txHash: data.hash,
          sender: data.header.sender.Move,
          sequenceNumber: data.header.sequence_number,
          maxGasAmount: data.header.max_gas_amount,
          gasUnitPrice: data.header.gas_unit_price,
          gasUsed: data.output.Move.gas_used,
          transactionCost:
            data.header.gas_unit_price * data.output.Move.gas_used,
          txExpirationTimestamp: Number(
            data.header.expiration_timestamp.microseconds_since_unix_epoch
          ),
          txConfirmationTime: Number(
            data.block_header.timestamp.microseconds_since_unix_epoch
          ),
          status:
            data.status === 'Fail' || data.status === 'Invalid'
              ? TransactionStatus.Failed
              : data.status,
          events: data.output.Move.events,
          blockNumber: data.block_header.height,
          blockHash: data.block_header.hash,
          transactionInsights: this.getTransactionInsights(
            account.toString(),
            data
          ),
          vm_status: data.output.Move.vm_status
        })
      })
      return combinedTxDetail
    } catch (error) {
      this.logger.error(
        'Failed to fetch complete account transactions detail',
        {
          error
        }
      )
      throw new ServiceError(
        'Failed to fetch complete account transactions detail',
        error as Error
      )
    }
  }

  /**
   * Invokes a view method of a smart contract.
   * @param functionFullName - Full name of the function (e.g., `0x1::module::function`).
   * @param typeArguments - Array of type arguments.
   * @param functionArguments - Array of function arguments.
   * @returns Result of the view method.
   */
  public async invokeViewMethod(
    functionFullName: string,
    typeArguments: Array<string>,
    functionArguments: Array<string>
  ): Promise<any> {
    try {
      const response = await this.requestService.sendRequest<any>( //  TO-DO:   We need to define return types for these responses
        '/rpc/v1/view',
        {
          function: functionFullName,
          type_arguments: typeArguments,
          arguments: functionArguments
        },
        'POST'
      )
      return response.data.result
    } catch (error) {
      this.logger.error('Failed to invoke view method', { error })
      throw new ServiceError('Failed to invoke view method', error as Error)
    }
  }

  /**
   * Accesses an item from a table using an associated key.
   * @param tableHandle - Table handle.
   * @param keyType - Type of the key.
   * @param valueType - Type of the value.
   * @param key - The actual key.
   * @returns Table item's data.
   */
  public async getTableItemByKey(
    tableHandle: string,
    keyType: string,
    valueType: string,
    key: string
  ): Promise<any> {
    try {
      const response = await this.requestService.sendRequest<any>( //  TO-DO:   We need to define return types for these responses
        `/rpc/v1/tables/${tableHandle}/item`,
        {
          key_type: keyType,
          value_type: valueType,
          key: key
        },
        'POST'
      )
      return response.data
    } catch (error) {
      this.logger.error('Failed to get table item by key', { error })
      throw new ServiceError('Failed to get table item by key', error as Error)
    }
  }

  /**
   * Transfers SupraCoin from sender to receiver.
   * @param senderAccount - Sender's SupraAccount.
   * @param receiverAccountAddr - Receiver's HexString address.
   * @param amount - Amount to transfer.
   * @param optionalArgs - Optional transaction arguments.
   * @returns TransactionResponse.
   */
  public async transferSupraCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    optionalArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    try {
      if (
        optionalArgs?.optionalTransactionPayloadArgs &&
        !optionalArgs.optionalTransactionPayloadArgs.maxGas
      ) {
        let maxGas = BigInt(
          DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_EXISTS
        )
        if (
          (await this.accountService.accountExists(receiverAccountAddr)) ==
          false
        ) {
          maxGas = BigInt(
            DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_NOT_EXISTS
          )
        }
        optionalArgs.optionalTransactionPayloadArgs.maxGas = maxGas
      }

      const rawTxn = await this.createRawTxObject(
        senderAccount.address(),
        (await this.accountService.getAccountInfo(senderAccount.address()))
          .sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        'supra_account',
        'transfer',
        [],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)],
        optionalArgs?.optionalTransactionPayloadArgs
      )

      const sendTxPayload = this.getSendTxPayload(senderAccount, rawTxn)

      return await this.sendTx(
        sendTxPayload,
        optionalArgs?.enableTransactionWaitAndSimulationArgs
      )
    } catch (error) {
      this.logger.error('Failed to transfer SupraCoin', { error })
      throw new ServiceError('Failed to transfer SupraCoin', error as Error)
    }
  }

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
    try {
      return new TxnBuilderTypes.RawTransaction(
        new TxnBuilderTypes.AccountAddress(senderAddr.toUint8Array()),
        senderSequenceNumber,
        new TxnBuilderTypes.TransactionPayloadEntryFunction(
          new TxnBuilderTypes.EntryFunction(
            new TxnBuilderTypes.ModuleId(
              new TxnBuilderTypes.AccountAddress(
                new HexString(normalizeAddress(moduleAddr)).toUint8Array()
              ),
              new TxnBuilderTypes.Identifier(moduleName)
            ),
            new TxnBuilderTypes.Identifier(functionName),
            functionTypeArgs,
            functionArgs
          )
        ),
        optionalTransactionPayloadArgs?.maxGas ?? DEFAULT_MAX_GAS_UNITS,
        optionalTransactionPayloadArgs?.gasUnitPrice ?? DEFAULT_GAS_PRICE,
        optionalTransactionPayloadArgs?.txExpiryTime ??
          BigInt(
            Math.ceil(Date.now() / MILLISECONDS_PER_SECOND) +
              DEFAULT_TX_EXPIRATION_DURATION
          ),
        this.chainId
      )
    } catch (error) {
      this.logger.error('Failed to create raw transaction object', { error })
      throw new ServiceError(
        'Failed to create raw transaction object',
        error as Error
      )
    }
  }

  /**
   * Constructs SendTxPayload from RawTransaction.
   * @param senderAccount - Sender's SupraAccount.
   * @param rawTxn - RawTransaction object.
   * @returns SendTxPayload.
   */
  public getSendTxPayload(
    senderAccount: SupraAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ): SendTxPayload {
    return {
      Move: {
        raw_txn: this.getRawTxnJSON(rawTxn),
        authenticator: {
          Ed25519: {
            public_key: senderAccount.pubKey().toString(),
            signature: this.signSupraTransaction(
              senderAccount,
              rawTxn
            ).toString()
          }
        }
      }
    }
  }

  /**
   * Converts Ed25519Authenticator to JSON format.
   * @param authenticator - AccountAuthenticatorEd25519 object.
   * @returns Ed25519AuthenticatorJSON.
   */
  private getED25519AuthenticatorJSON(
    authenticator: TxnBuilderTypes.AccountAuthenticatorEd25519
  ): any {
    // Replace with appropriate type
    return {
      Ed25519: {
        public_key: Buffer.from(authenticator.public_key.value).toString('hex'),
        signature: Buffer.from(authenticator.signature.value).toString('hex')
      }
    }
  }

  /**
   * Generates the JSON representation of a raw transaction.
   * @param rawTxn - RawTransaction object.
   * @returns RawTxnJSON.
   */
  private getRawTxnJSON(rawTxn: TxnBuilderTypes.RawTransaction): RawTxnJSON {
    let txPayload = (
      rawTxn.payload as TxnBuilderTypes.TransactionPayloadEntryFunction
    ).value

    return {
      sender: rawTxn.sender.toHexString().toString(),
      sequence_number: Number(rawTxn.sequence_number),
      payload: {
        EntryFunction: {
          module: {
            address: txPayload.module_name.address.toHexString().toString(),
            name: txPayload.module_name.name.value
          },
          function: txPayload.function_name.value,
          ty_args: parseFunctionTypeArgs(txPayload.ty_args),
          args: fromUint8ArrayToJSArray(txPayload.args)
        }
      },
      max_gas_amount: Number(rawTxn.max_gas_amount),
      gas_unit_price: Number(rawTxn.gas_unit_price),
      expiration_timestamp_secs: Number(rawTxn.expiration_timestamp_secs),
      chain_id: rawTxn.chain_id.value
    }
  }

  /**
   * Retrieves transaction insights based on transaction data.
   * @param userAddress - User's account address.
   * @param txData - Transaction data.
   * @returns TransactionInsights object.
   */
  public getTransactionInsights(
    userAddress: string,
    txData: any
  ): TransactionInsights {
    const txInsights: TransactionInsights = {
      coinReceiver: '',
      coinChange: [
        {
          amount: BigInt(0),
          coinType: ''
        }
      ],
      type: TxTypeForTransactionInsights.ScriptCall
    }

    const { payload, header, status, output } = txData

    if (payload.Move.type === 'entry_function_payload') {
      const {
        function: functionName,
        arguments: args,
        type_arguments: typeArgs
      } = payload.Move

      switch (functionName) {
        case '0x1::supra_account::transfer':
          {
            let amountChange = BigInt(args[1])
            if (userAddress === header.sender.Move) {
              amountChange *= BigInt(-1)
            }
            txInsights.coinReceiver = args[0]
            txInsights.coinChange[0] = {
              amount: amountChange,
              coinType: '0x1::supra_coin::SupraCoin'
            }
            txInsights.type = TxTypeForTransactionInsights.CoinTransfer
          }
          break
        case '0x1::supra_account::transfer_coins':
        case '0x1::coin::transfer':
          {
            let amountChange = BigInt(args[1])
            if (userAddress === header.sender.Move) {
              amountChange *= BigInt(-1)
            }
            txInsights.coinReceiver = args[0]
            txInsights.coinChange[0] = {
              amount: amountChange,
              coinType: typeArgs[0]
            }
            txInsights.type = TxTypeForTransactionInsights.CoinTransfer
          }
          break
        default:
          if (status === TransactionStatus.Success) {
            txInsights.coinChange = this.getCoinChangeAmount(
              userAddress,
              output.Move.events
            )
          }
          txInsights.type = TxTypeForTransactionInsights.EntryFunctionCall
          break
      }
    } else if (
      status === TransactionStatus.Success &&
      payload.Move.type === 'script_payload'
    ) {
      txInsights.coinChange = this.getCoinChangeAmount(
        userAddress,
        output.Move.events
      )
    } else {
      throw new Error(
        'Something went wrong, found unsupported type of transaction'
      )
    }

    return txInsights
  }

  /**
   * Calculates the amount change based on coin transfer events.
   * @param userAddress - User's account address.
   * @param events - Array of event data.
   * @returns Array of CoinChange.
   */
  public getCoinChangeAmount(
    userAddress: string,
    events: any[]
  ): Array<CoinChange> {
    let coinChange: Map<
      string,
      {
        totalDeposit: bigint
        totalWithdraw: bigint
      }
    > = new Map()

    events.forEach((eventData) => {
      if (
        (eventData.type === '0x1::coin::CoinDeposit' ||
          eventData.type === '0x1::coin::CoinWithdraw') &&
        '0x' +
          eventData.data.account
            .substring(2, eventData.data.account)
            .padStart(64, '0') ===
          userAddress
      ) {
        if (eventData.type === '0x1::coin::CoinDeposit') {
          let curData = coinChange.get(eventData.data.coin_type)
          if (curData != undefined) {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit:
                curData.totalDeposit + BigInt(eventData.data.amount),
              totalWithdraw: curData.totalWithdraw
            })
          } else {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit: BigInt(eventData.data.amount),
              totalWithdraw: BigInt(0)
            })
          }
        } else if (eventData.type === '0x1::coin::CoinWithdraw') {
          let curData = coinChange.get(eventData.data.coin_type)
          if (curData != undefined) {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit: curData.totalDeposit,
              totalWithdraw:
                curData.totalWithdraw + BigInt(eventData.data.amount)
            })
          } else {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit: BigInt(0),
              totalWithdraw: BigInt(eventData.data.amount)
            })
          }
        }
      }
    })

    let coinChangeParsed: CoinChange[] = []
    coinChange.forEach(
      (
        value: {
          totalDeposit: bigint
          totalWithdraw: bigint
        },
        key: string
      ) => {
        coinChangeParsed.push({
          coinType: key,
          amount: value.totalDeposit - value.totalWithdraw
        })
      }
    )
    return coinChangeParsed
  }

  /**
   * Retrieves transactions sent by the account.
   * @param account - Supra account address.
   * @param paginationArgs - Arguments for pagination.
   * @returns List of `TransactionDetail`.
   */
  public async getAccountTransactionsDetail(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<TransactionDetail[]> {
    try {
      const count = paginationArgs?.count ?? DEFAULT_RECORDS_ITEMS_COUNT
      const start = paginationArgs?.start
        ? `&start=${paginationArgs.start}`
        : ''
      const requestPath = `/rpc/v1/accounts/${account.toString()}/transactions?count=${count}${start}`

      const response = await this.requestService.sendRequest<any>(requestPath)

      if (response.data.record == null) {
        throw new ServiceError(
          'Account does not exist or invalid account provided.',
          new Error('No transaction data')
        )
      }

      return response.data.record.map((data: any) => ({
        txHash: data.hash,
        sender: data.header.sender.Move,
        sequenceNumber: data.header.sequence_number,
        maxGasAmount: data.header.max_gas_amount,
        gasUnitPrice: data.header.gas_unit_price,
        gasUsed: data.output.Move.gas_used,
        transactionCost: data.header.gas_unit_price * data.output.Move.gas_used,
        txExpirationTimestamp: Number(
          data.header.expiration_timestamp.microseconds_since_unix_epoch
        ),
        txConfirmationTime: Number(
          data.block_header.timestamp.microseconds_since_unix_epoch
        ),
        status:
          data.status === 'Fail' || data.status === 'Invalid'
            ? TransactionStatus.Failed
            : data.status,
        events: data.output.Move.events,
        blockNumber: data.block_header.height,
        blockHash: data.block_header.hash,
        transactionInsights: this.getTransactionInsights(
          account.toString(),
          data
        ),
        vm_status: data.output.Move.vm_status
      })) as TransactionDetail[]
    } catch (error) {
      this.logger.error('Failed to fetch account transactions detail', {
        error
      })
      throw new ServiceError(
        'Failed to fetch account transactions detail',
        error as Error
      )
    }
  }

  /**
   * Transfers custom coin from sender to receiver.
   * @param senderAccount - Sender's SupraAccount.
   * @param receiverAccountAddr - Receiver's HexString address.
   * @param amount - Amount to transfer.
   * @param coinType - Type of custom coin.
   * @param optionalArgs - Optional transaction arguments.
   * @returns TransactionResponse.
   */
  public async transferCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    coinType: string,
    optionalArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    try {
      const typeTag = new TxnBuilderTypes.TypeTagParser(coinType).parseTypeTag()

      const rawTxn = await this.createRawTxObject(
        senderAccount.address(),
        (await this.accountService.getAccountInfo(senderAccount.address()))
          .sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        'supra_account',
        'transfer_coins',
        [typeTag],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)],
        optionalArgs?.optionalTransactionPayloadArgs
      )

      const sendTxPayload = this.getSendTxPayload(senderAccount, rawTxn)

      return await this.sendTx(
        sendTxPayload,
        optionalArgs?.enableTransactionWaitAndSimulationArgs
      )
    } catch (error) {
      this.logger.error('Failed to transfer custom coin', { error })
      throw new ServiceError('Failed to transfer custom coin', error as Error)
    }
  }

  /**
   * Publishes a package or module on the Supra network.
   * @param senderAccount - Module publisher's SupraAccount.
   * @param packageMetadata - Package metadata as Uint8Array.
   * @param modulesCode - Array of module codes as Uint8Array.
   * @param optionalArgs - Optional transaction arguments.
   * @returns TransactionResponse.
   */
  public async publishPackage(
    senderAccount: SupraAccount,
    packageMetadata: Uint8Array,
    modulesCode: Uint8Array[],
    optionalArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    try {
      const codeSerializer = new BCS.Serializer()
      const modulesTypeCode: TxnBuilderTypes.Module[] = modulesCode.map(
        (code) => new TxnBuilderTypes.Module(code)
      )
      BCS.serializeVector(modulesTypeCode, codeSerializer)

      const rawTxn = await this.createRawTxObject(
        senderAccount.address(),
        (await this.accountService.getAccountInfo(senderAccount.address()))
          .sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        'code',
        'publish_package_txn',
        [],
        [BCS.bcsSerializeBytes(packageMetadata), codeSerializer.getBytes()],
        optionalArgs?.optionalTransactionPayloadArgs
      )

      const sendTxPayload = this.getSendTxPayload(senderAccount, rawTxn)

      return await this.sendTx(
        sendTxPayload,
        optionalArgs?.enableTransactionWaitAndSimulationArgs
      )
    } catch (error) {
      this.logger.error('Failed to publish package', { error })
      throw new ServiceError('Failed to publish package', error as Error)
    }
  }

  /**
   * Creates a serialized raw transaction.
   * @param senderAddr - Sender's HexString address.
   * @param senderSequenceNumber - Sender's sequence number.
   * @param moduleAddr - Target module address.
   * @param moduleName - Target module name.
   * @param functionName - Target function name.
   * @param functionTypeArgs - Array of function type arguments.
   * @param functionArgs - Array of function arguments as Uint8Array.
   * @param optionalArgs - Optional transaction payload arguments.
   * @returns Serialized raw transaction as Uint8Array.
   */
  public async createSerializedRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalArgs?: OptionalTransactionPayloadArgs
  ): Promise<Uint8Array> {
    try {
      const rawTxn = await this.createRawTxObject(
        senderAddr,
        senderSequenceNumber,
        moduleAddr,
        moduleName,
        functionName,
        functionTypeArgs,
        functionArgs,
        optionalArgs
      )
      return BCS.bcsToBytes(rawTxn)
    } catch (error) {
      this.logger.error('Failed to create serialized raw transaction object', {
        error
      })
      throw new ServiceError(
        'Failed to create serialized raw transaction object',
        error as Error
      )
    }
  }

  /**
   * Sends a serialized raw transaction.
   * @param senderAccount - Sender's SupraAccount.
   * @param serializedRawTransaction - Serialized raw transaction as Uint8Array.
   * @param enableArgs - Optional arguments to enable wait and simulation.
   * @returns TransactionResponse.
   */
  public async sendTxUsingSerializedRawTransaction(
    senderAccount: SupraAccount,
    serializedRawTransaction: Uint8Array,
    enableArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    try {
      const rawTxn = TxnBuilderTypes.RawTransaction.deserialize(
        new BCS.Deserializer(serializedRawTransaction)
      )
      const sendTxPayload = this.getSendTxPayload(senderAccount, rawTxn)
      return await this.sendTx(sendTxPayload, enableArgs)
    } catch (error) {
      this.logger.error('Failed to send serialized raw transaction', { error })
      throw new ServiceError(
        'Failed to send serialized raw transaction',
        error as Error
      )
    }
  }

  /**
   * Sends a sponsor transaction.
   * @param feePayerAddress - Fee payer's account address.
   * @param secondarySignersAccountAddress - Array of secondary signers' account addresses.
   * @param rawTxn - Raw transaction object.
   * @param senderAuthenticator - Sender's authenticator.
   * @param feePayerAuthenticator - Fee payer's authenticator.
   * @param secondarySignersAuthenticator - Array of secondary signers' authenticators.
   * @param enableArgs - Optional arguments to enable wait and simulation.
   * @returns TransactionResponse.
   */
  public async sendSponsorTransaction(
    feePayerAddress: string,
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    feePayerAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator: Array<TxnBuilderTypes.AccountAuthenticatorEd25519> = [],
    enableArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    try {
      const secondarySignersAuthenticatorJSON: Array<Ed25519AuthenticatorJSON> =
        secondarySignersAuthenticator.map((authenticator) =>
          this.getED25519AuthenticatorJSON(authenticator)
        )

      const sendTxPayload: SendTxPayload = {
        Move: {
          raw_txn: this.getRawTxnJSON(rawTxn),
          authenticator: {
            FeePayer: {
              sender: this.getED25519AuthenticatorJSON(senderAuthenticator),
              secondary_signer_addresses: secondarySignersAccountAddress,
              secondary_signers: secondarySignersAuthenticatorJSON,
              fee_payer_address: feePayerAddress,
              fee_payer_signer: this.getED25519AuthenticatorJSON(
                feePayerAuthenticator
              )
            }
          }
        }
      }

      return await this.sendTx(sendTxPayload, enableArgs)
    } catch (error) {
      this.logger.error('Failed to send sponsor transaction', { error })
      throw new ServiceError(
        'Failed to send sponsor transaction',
        error as Error
      )
    }
  }

  /**
   * Sends a multi-agent transaction.
   * @param secondarySignersAccountAddress - Array of secondary signers' account addresses.
   * @param rawTxn - Raw transaction object.
   * @param senderAuthenticator - Sender's authenticator.
   * @param secondarySignersAuthenticator - Array of secondary signers' authenticators.
   * @param enableArgs - Optional arguments to enable wait and simulation.
   * @returns TransactionResponse.
   */
  public async sendMultiAgentTransaction(
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator: Array<TxnBuilderTypes.AccountAuthenticatorEd25519>,
    enableArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    try {
      const secondarySignersAuthenticatorJSON: Array<Ed25519AuthenticatorJSON> =
        secondarySignersAuthenticator.map((authenticator) =>
          this.getED25519AuthenticatorJSON(authenticator)
        )

      const sendTxPayload: SendTxPayload = {
        Move: {
          raw_txn: this.getRawTxnJSON(rawTxn),
          authenticator: {
            MultiAgent: {
              sender: this.getED25519AuthenticatorJSON(senderAuthenticator),
              secondary_signer_addresses: secondarySignersAccountAddress,
              secondary_signers: secondarySignersAuthenticatorJSON
            }
          }
        }
      }

      return await this.sendTx(sendTxPayload, enableArgs)
    } catch (error) {
      this.logger.error('Failed to send multi-agent transaction', { error })
      throw new ServiceError(
        'Failed to send multi-agent transaction',
        error as Error
      )
    }
  }

  /**
   * Retrieves coin information.
   * @param coinType - Type of the coin.
   * @returns CoinInfo object.
   */
  public async getCoinInfo(coinType: string): Promise<CoinInfo> {
    try {
      const resource = await this.accountService.getResourceData(
        new HexString(coinType.substring(0, 66)),
        `${SUPRA_FRAMEWORK_ADDRESS}::coin::CoinInfo<${coinType}>`
      )
      return {
        name: resource.name,
        symbol: resource.symbol,
        decimals: resource.decimals
      }
    } catch (error) {
      this.logger.error('Failed to fetch coin info', { error })
      throw new ServiceError('Failed to fetch coin info', error as Error)
    }
  }

  /**
   * Airdrop test Supra token on given account
   * @param account - Hex-encoded 32 byte Supra account address
   * @returns `FaucetRequestResponse`
   */
  public async fundAccountWithFaucet(
    account: HexString
  ): Promise<FaucetRequestResponse> {
    let resData = await this.requestService.sendRequest(
      `/rpc/v1/wallet/faucet/${account.toString()}`
    )

    if (typeof resData.data === 'object') {
      if (resData.data.hasOwnProperty('Accepted')) {
        return {
          status: await this.waitForTransactionCompletion(
            resData.data.Accepted
          ),
          transactionHash: resData.data.Accepted
        }
      } else {
        throw new Error(
          'something went wrong, getting unexpected response from rpc_node'
        )
      }
    } else {
      throw new Error('try faucet later')
    }
  }

  /**
   * Send `entry_function_payload` type tx using serialized raw transaction data and ed25519 signature
   * @param senderPubkey - Sender ed25519 pubkey
   * @param signature - Ed25519 signature
   * @param serializedRawTransaction - Serialized raw transaction data
   * @param enableTransactionWaitAndSimulationArgs - enable transaction wait and simulation arguments
   * @returns `TransactionResponse`
   */
  async sendTxUsingSerializedRawTransactionAndSignature(
    senderPubkey: HexString,
    signature: HexString,
    serializedRawTransaction: Uint8Array,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    let sendTxPayload = {
      Move: {
        raw_txn: this.getRawTxnJSON(
          TxnBuilderTypes.RawTransaction.deserialize(
            new BCS.Deserializer(serializedRawTransaction)
          )
        ),
        authenticator: {
          Ed25519: {
            public_key: senderPubkey.toString(),
            signature: signature.toString()
          }
        }
      }
    }

    return await this.sendTx(
      sendTxPayload,
      enableTransactionWaitAndSimulationArgs
    )
  }
}
