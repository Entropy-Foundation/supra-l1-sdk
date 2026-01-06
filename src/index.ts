import {
  TxnBuilderTypes,
  BCS,
  HexString,
  SupraAccount,
  AnyRawTransaction,
} from "supra-l1-sdk-core";
import axios, { AxiosResponse, HttpStatusCode } from "axios";
import {
  normalizeAddress,
  fromUint8ArrayToJSArray,
  sleep,
  parseFunctionTypeArgs,
  parseScriptArgs,
} from "./utils";
import {
  TransactionStatus,
  TransactionResponse,
  TransactionDetail,
  SendTxPayload,
  AccountInfo,
  AccountResource,
  TransactionInsights,
  TxTypeForTransactionInsights,
  CoinInfo,
  CoinChange,
  FaucetRequestResponse,
  EnableTransactionWaitAndSimulationArgs,
  OptionalTransactionPayloadArgs,
  OptionalTransactionArgs,
  PaginationArgs,
  RawTxnJSON,
  AnyAuthenticatorJSON,
  Ed25519AuthenticatorJSON,
  TransactionPayloadJSON,
  OrderedPaginationArgs,
  AccountResourcesResponse,
  AccountCoinTransactionsResponse,
} from "./types";
import {
  DEFAULT_CHAIN_ID,
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
  DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_NOT_EXISTS,
  RAW_TRANSACTION_SALT,
  RAW_TRANSACTION_WITH_DATA_SALT,
  SUPRA_COIN_TYPE,
  X_SUPRA_CURSOR,
} from "./constants";
import sha3 from "js-sha3";

export * from "./types";
export * from "./constants";
export { TxnBuilderTypes, BCS, HexString, SupraAccount };

/**
 * Provides methods for interacting with supra rpc node.
 */
export class SupraClient {
  supraNodeURL: string;
  chainId: TxnBuilderTypes.ChainId;

  constructor(url: string, chainId: number = DEFAULT_CHAIN_ID) {
    this.supraNodeURL = url;
    this.chainId = new TxnBuilderTypes.ChainId(chainId);
  }

  /**
   * Creates and initializes `SupraClient` instance
   * The chain id will be fetched from the provided `url`
   * @param url rpc url of supra rpc node
   * @returns `SupraClient` initialized instance
   * @example
   * ```typescript
   * let supraClient = await SupraClient.init(
   *    "http://localhost:27001/"
   * );
   * ```
   */
  static async init(url: string): Promise<SupraClient> {
    let supraClient = new SupraClient(url);
    supraClient.chainId = await supraClient.getChainId();
    return supraClient;
  }

  private async sendRequest({
    isGetMethod = true,
    subURL,
    data,
    ignoreStatuses = [],
  }: Readonly<{
    isGetMethod?: boolean;
    subURL: string;
    data?: any;
    ignoreStatuses?: HttpStatusCode[];
  }>): Promise<AxiosResponse<any, any>> {
    if (!isGetMethod && data === undefined) {
      throw new Error("POST request requires a 'data' payload.");
    }

    const config = {
      method: isGetMethod ? "get" : "post",
      baseURL: this.supraNodeURL,
      url: subURL,
      validateStatus: (status: HttpStatusCode) =>
        status === HttpStatusCode.Ok || ignoreStatuses.includes(status),
      ...(isGetMethod
        ? {}
        : {
            data,
            headers: {
              "Content-Type": "application/json",
            },
          }),
    };
    const resData = await axios(config);
    if (resData.status === HttpStatusCode.InternalServerError) {
      throw new Error("Server side error — please try again later.");
    }
    if (resData.status === HttpStatusCode.ServiceUnavailable) {
      throw new Error(
        "Service Temporarily Unavailable — please try again later."
      );
    }
    return resData;
  }

  /**
   * Get Chain Id Of Supra Network
   * @returns Chain Id of network
   */
  async getChainId(): Promise<TxnBuilderTypes.ChainId> {
    return new TxnBuilderTypes.ChainId(
      Number(
        (
          await this.sendRequest({
            subURL: "/rpc/v3/transactions/chain_id",
          })
        ).data
      )
    );
  }

  /**
   * Get current `mean_gas_price`
   * @returns Current `mean_gas_price`
   */
  async getGasPrice(): Promise<bigint> {
    return BigInt(
      (
        await this.sendRequest({
          subURL: "/rpc/v3/gas_price",
        })
      ).data.mean_gas_price
    );
  }

  /**
   * Airdrop test Supra token on given account
   * @param account Hex-encoded 32 byte Supra account address
   * @returns `FaucetRequestResponse`
   */
  async fundAccountWithFaucet(
    account: HexString
  ): Promise<FaucetRequestResponse> {
    const resData = await this.sendRequest({
      subURL: `/rpc/v3/wallet/faucet/${account.toString()}`,
      ignoreStatuses: [HttpStatusCode.TooManyRequests],
    });
    if (resData.status === HttpStatusCode.TooManyRequests) {
      throw new Error(
        "Your account recently received some tokens, please try later."
      );
    }
    const transactionHash = resData.data.Accepted;
    return {
      status: await this.waitForTransactionCompletion(transactionHash),
      transactionHash,
    };
  }

  /**
   * Check whether given account exists onchain or not
   * @param account Hex-encoded 32 byte Supra account address
   * @returns `true` if account exists otherwise `false`
   */
  async isAccountExists(account: HexString): Promise<boolean> {
    let resData = await this.sendRequest({
      subURL: `/rpc/v3/accounts/${account.toString()}`,
      ignoreStatuses: [HttpStatusCode.BadRequest],
    });
    return resData.status === HttpStatusCode.Ok;
  }

  /**
   * Get info of given supra account
   * @param account Hex-encoded 32 byte Supra account address
   * @returns `AccountInfo`
   */
  async getAccountInfo(account: HexString): Promise<AccountInfo> {
    const resData = await this.sendRequest({
      subURL: `/rpc/v3/accounts/${account.toString()}`,
    });
    return {
      sequence_number: BigInt(resData.data.sequence_number),
      authentication_key: resData.data.authentication_key,
    };
  }

  /**
   * Get list of all resources held by given supra account
   * @param account Hex-encoded 32 byte Supra account address
   * @param paginationArgs Arguments for pagination response
   * @returns `AccountResourcesResponse`
   */
  async getAccountResources(
    account: HexString,
    paginationArgs?: PaginationArgs
  ): Promise<AccountResourcesResponse> {
    let requestPath = `/rpc/v3/accounts/${account.toString()}/resources?count=${
      paginationArgs?.count ?? DEFAULT_RECORDS_ITEMS_COUNT
    }`;
    if (paginationArgs?.start) {
      requestPath += `&start=${paginationArgs.start}`;
    }
    let resData = await this.sendRequest({ subURL: requestPath });
    return {
      resources: resData.data as AccountResource[],
      cursor: resData.headers[X_SUPRA_CURSOR],
    };
  }

  /**
   * Get data of resource held by given supra account
   * @param account Hex-encoded 32 byte Supra account address
   * @param resourceType Type of a resource
   * @returns `AccountResource`
   * @example
   * ```typescript
   * let supraCoinInfo = await supraClient.getResourceData(
   *   new HexString("0x1"),
   *   "0x1::coin::CoinInfo<0x1::supra_coin::SupraCoin>"
   * )
   * ```
   */
  async getResourceData(
    account: HexString,
    resourceType: string
  ): Promise<AccountResource> {
    const resData = await this.sendRequest({
      subURL: `/rpc/v3/accounts/${account.toString()}/resources/${resourceType}`,
    });
    return resData.data as AccountResource;
  }

  /**
   * Get status of given supra transaction
   * @param transactionHash Hex-encoded 32 byte transaction hash for getting transaction status
   * @returns `TransactionStatus` or `null`
   */
  async getTransactionStatus(
    transactionHash: string
  ): Promise<TransactionStatus | null> {
    let resData = await this.sendRequest({
      subURL: `/rpc/v3/transactions/${transactionHash}`,
      ignoreStatuses: [HttpStatusCode.NotFound],
    });
    if (resData.status === HttpStatusCode.NotFound || !resData.data) {
      return null;
    }
    return resData.data.status === "Unexecuted"
      ? TransactionStatus.Pending
      : resData.data.status === "Fail"
      ? TransactionStatus.Failed
      : resData.data.status;
  }

  private getCoinChangeAmount(
    userAddress: string,
    events: any[]
  ): Array<CoinChange> {
    let coinChange: Map<
      string,
      {
        totalDeposit: bigint;
        totalWithdraw: bigint;
      }
    > = new Map();
    events.forEach((eventData) => {
      if (
        (eventData.type === "0x1::coin::CoinDeposit" ||
          eventData.type === "0x1::coin::CoinWithdraw") &&
        "0x" +
          eventData.data.account
            .substring(2, eventData.data.account)
            .padStart(64, "0") ===
          userAddress
      ) {
        if (eventData.type === "0x1::coin::CoinDeposit") {
          let curData = coinChange.get(eventData.data.coin_type);
          if (curData != undefined) {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit:
                curData.totalDeposit + BigInt(eventData.data.amount),
              totalWithdraw: curData.totalWithdraw,
            });
          } else {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit: BigInt(eventData.data.amount),
              totalWithdraw: BigInt(0),
            });
          }
        } else if (eventData.type === "0x1::coin::CoinWithdraw") {
          let curData = coinChange.get(eventData.data.coin_type);
          if (curData != undefined) {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit: curData.totalDeposit,
              totalWithdraw:
                curData.totalWithdraw + BigInt(eventData.data.amount),
            });
          } else {
            coinChange.set(eventData.data.coin_type, {
              totalDeposit: BigInt(0),
              totalWithdraw: BigInt(eventData.data.amount),
            });
          }
        }
      }
    });
    let coinChangeParsed: CoinChange[] = [];
    coinChange.forEach(
      (
        value: {
          totalDeposit: bigint;
          totalWithdraw: bigint;
        },
        key: string
      ) => {
        coinChangeParsed.push({
          coinType: key,
          amount: value.totalDeposit - value.totalWithdraw,
        });
      }
    );
    return coinChangeParsed;
  }

  private getTransactionInsights(
    userAddress: string,
    txData: any
  ): TransactionInsights {
    let txInsights: TransactionInsights = {
      coinReceiver: "",
      coinChange: [
        {
          amount: BigInt(0),
          coinType: "",
        },
      ],
      type: TxTypeForTransactionInsights.EntryFunctionCall,
    };

    // NOTE: Need to optimize this conditionals
    if (txData.payload.Move.type === "entry_function_payload") {
      if (txData.payload.Move.function === "0x1::supra_account::transfer") {
        let amountChange = BigInt(txData.payload.Move.arguments[1]);
        if (userAddress === txData.header.sender.Move) {
          amountChange *= BigInt(-1);
        }
        txInsights.coinReceiver = txData.payload.Move.arguments[0];
        txInsights.coinChange[0] = {
          amount: amountChange,
          coinType: SUPRA_COIN_TYPE,
        };
        txInsights.type = TxTypeForTransactionInsights.CoinTransfer;
      } else if (
        txData.payload.Move.function === "0x1::supra_account::transfer_coins" ||
        txData.payload.Move.function === "0x1::coin::transfer"
      ) {
        let amountChange = BigInt(txData.payload.Move.arguments[1]);
        if (userAddress === txData.header.sender.Move) {
          amountChange *= BigInt(-1);
        }
        txInsights.coinReceiver = txData.payload.Move.arguments[0];
        txInsights.coinChange[0] = {
          amount: amountChange,
          coinType: txData.payload.Move.type_arguments[0],
        };
        txInsights.type = TxTypeForTransactionInsights.CoinTransfer;
      } else {
        if (txData.status === TransactionStatus.Success) {
          txInsights.coinChange = this.getCoinChangeAmount(
            userAddress,
            txData.output.Move.events
          );
        }
      }
    } else {
      if (txData.payload.Move.type === "script_payload") {
        txInsights.type = TxTypeForTransactionInsights.ScriptCall;
      } else if (
        txData.payload.Move.type === "automation_registration_payload"
      ) {
        txInsights.type = TxTypeForTransactionInsights.AutomationRegistration;
      } else if (txData.payload.Move.type === "multisig_payload") {
        txInsights.type = TxTypeForTransactionInsights.MultisigPayload;
      } else {
        throw new Error("Unsupported transaction payload type.");
      }

      if (txData.status === TransactionStatus.Success) {
        txInsights.coinChange = this.getCoinChangeAmount(
          userAddress,
          txData.output.Move.events
        );
      }
    }
    return txInsights;
  }

  /**
   * Get transaction details of given transaction hash
   * @param account Hex-encoded 32 byte Supra account address
   * @param transactionHash Hex-encoded 32 byte transaction hash for getting transaction details
   * @returns `TransactionDetail` or `null`
   */
  async getTransactionDetail(
    account: HexString,
    transactionHash: string
  ): Promise<TransactionDetail | null> {
    let resData = await this.sendRequest({
      subURL: `/rpc/v3/transactions/${transactionHash}`,
    });

    if (resData.data === null) {
      return null;
    }

    // Added Patch to resolve inconsistencies issue of `rpc_node`
    if (
      resData.data.status === TransactionStatus.Pending ||
      !resData.data.output ||
      !resData.data.header
    ) {
      return {
        txHash: transactionHash,
        sender: resData.data.header.sender.Move,
        sequenceNumber: resData.data.header.sequence_number,
        maxGasAmount: resData.data.header.max_gas_amount,
        gasUnitPrice: resData.data.header.gas_unit_price,
        gasUsed: undefined,
        transactionCost: undefined,
        txExpirationTimestamp: Number(
          resData.data.header.expiration_timestamp.microseconds_since_unix_epoch
        ),
        txConfirmationTime: undefined,
        status: resData.data.status,
        events: undefined,
        blockNumber: undefined,
        blockHash: undefined,
        transactionInsights: this.getTransactionInsights(
          account.toString(),
          resData.data
        ),
        vm_status: undefined,
      };
    }
    return {
      txHash: transactionHash,
      sender: resData.data.header.sender.Move,
      sequenceNumber: resData.data.header.sequence_number,
      maxGasAmount: resData.data.header.max_gas_amount,
      gasUnitPrice: resData.data.header.gas_unit_price,
      gasUsed: resData.data.output?.Move.gas_used,
      transactionCost:
        resData.data.header.gas_unit_price * resData.data.output?.Move.gas_used,
      txExpirationTimestamp: Number(
        resData.data.header.expiration_timestamp.microseconds_since_unix_epoch
      ),
      txConfirmationTime: Number(
        resData.data.block_header.timestamp.microseconds_since_unix_epoch
      ),
      status:
        resData.data.status === "Fail" || resData.data.status === "Invalid"
          ? "Failed"
          : resData.data.status,
      events: resData.data.output?.Move.events,
      blockNumber: resData.data.block_header.height,
      blockHash: resData.data.block_header.hash,
      transactionInsights: this.getTransactionInsights(
        account.toString(),
        resData.data
      ),
      vm_status: resData.data.output.Move.vm_status,
    };
  }

  /**
   * Get transactions sent by the account
   * @param account Supra account address
   * @param paginationArgs Arguments for ordered pagination response
   * @returns List of `TransactionDetail`
   */
  async getAccountTransactionsDetail(
    account: HexString,
    paginationArgs?: OrderedPaginationArgs
  ): Promise<TransactionDetail[]> {
    let requestPath = `/rpc/v3/accounts/${account.toString()}/transactions?count=${
      paginationArgs?.count ?? DEFAULT_RECORDS_ITEMS_COUNT
    }`;
    if (paginationArgs?.start) {
      requestPath += `&start=${paginationArgs.start}`;
    }
    if (paginationArgs?.ascending) {
      requestPath += `&ascending=${paginationArgs.ascending}`;
    }

    let resData = await this.sendRequest({
      subURL: requestPath,
    });
    let accountTransactionsDetail: TransactionDetail[] = [];
    resData.data.forEach((data: any) => {
      accountTransactionsDetail.push({
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
          data.status === "Fail" || data.status === "Invalid"
            ? "Failed"
            : data.status,
        events: data.output.Move.events,
        blockNumber: data.block_header.height,
        blockHash: data.block_header.hash,
        transactionInsights: this.getTransactionInsights(
          account.toString(),
          data
        ),
        vm_status: data.output.Move.vm_status,
      });
    });
    return accountTransactionsDetail;
  }

  /**
   * Get Coin Transfer related transactions associated with the account
   * @param account Supra account address
   * @param paginationArgs Arguments for ordered pagination response
   * @returns `AccountCoinTransactionsResponse`
   */
  async getCoinTransactionsDetail(
    account: HexString,
    paginationArgs?: OrderedPaginationArgs
  ): Promise<AccountCoinTransactionsResponse> {
    let requestPath = `/rpc/v3/accounts/${account.toString()}/coin_transactions?count=${
      paginationArgs?.count ?? DEFAULT_RECORDS_ITEMS_COUNT
    }`;
    if (paginationArgs?.start) {
      requestPath += `&start=${paginationArgs?.start}`;
    }
    if (paginationArgs?.ascending) {
      requestPath += `&ascending=${paginationArgs.ascending}`;
    }

    let resData = await this.sendRequest({
      subURL: requestPath,
    });
    let coinTransactionsDetail: TransactionDetail[] = [];
    resData.data.forEach((data: any) => {
      coinTransactionsDetail.push({
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
          data.status === "Fail" || data.status === "Invalid"
            ? "Failed"
            : data.status,
        events: data.output.Move.events,
        blockNumber: data.block_header.height,
        blockHash: data.block_header.hash,
        transactionInsights: this.getTransactionInsights(
          account.toString(),
          data
        ),
        vm_status: data.output.Move.vm_status,
      });
    });
    return {
      transactions: coinTransactionsDetail,
      cursor: resData.headers[X_SUPRA_CURSOR],
    };
  }

  /**
   * Get transactions sent by the account and Coin transfer related transactions
   * @param account Supra account address
   * @param count Number of coin transfer transactions and account sent transaction to be considered,
   * For instance if the value is `N` so total `N*2` transactions will be returned.
   * @returns List of `TransactionDetail`
   */
  async getAccountCompleteTransactionsDetail(
    account: HexString,
    count: number = DEFAULT_RECORDS_ITEMS_COUNT
  ): Promise<TransactionDetail[]> {
    let coinTransactions = await this.sendRequest({
      subURL: `/rpc/v3/accounts/${account.toString()}/coin_transactions?count=${count}`,
    });
    let accountSendedTransactions = await this.sendRequest({
      subURL: `/rpc/v3/accounts/${account.toString()}/transactions?count=${count}`,
    });

    let combinedTxArray: any[] = [];
    if (coinTransactions.data) {
      combinedTxArray.push(...coinTransactions.data);
    }
    if (accountSendedTransactions.data) {
      combinedTxArray.push(...accountSendedTransactions.data);
    }

    let combinedTx = combinedTxArray.filter(
      (item, index, self) =>
        index === self.findIndex((data) => data.hash === item.hash)
    );
    combinedTx.sort((a, b) => {
      if (
        a.block_header.timestamp.microseconds_since_unix_epoch <
        b.block_header.timestamp.microseconds_since_unix_epoch
      ) {
        return 1;
      } else {
        return -1;
      }
    });

    let coinTransactionsDetail: TransactionDetail[] = [];
    combinedTx.forEach((data: any) => {
      coinTransactionsDetail.push({
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
          data.status === "Fail" || data.status === "Invalid"
            ? "Failed"
            : data.status,
        events: data.output.Move.events,
        blockNumber: data.block_header.height,
        blockHash: data.block_header.hash,
        transactionInsights: this.getTransactionInsights(
          account.toString(),
          data
        ),
        vm_status: data.output.Move.vm_status,
      });
    });
    return coinTransactionsDetail;
  }

  /**
   * Get coin info of the given coin type
   * @param coinType Type of a coin resource
   * @returns CoinInfo
   */
  async getCoinInfo(coinType: string): Promise<CoinInfo> {
    let coinInfoResource = await this.getResourceData(
      new HexString(coinType.split("::")[0]),
      `${SUPRA_FRAMEWORK_ADDRESS}::coin::CoinInfo<${coinType}>`
    );
    return {
      name: coinInfoResource.data.name,
      symbol: coinInfoResource.data.symbol,
      decimals: coinInfoResource.data.decimals,
    };
  }

  /**
   * Get Supra balance of given account
   * @param account Supra Account address for getting balance
   * @returns Supra Balance
   */
  async getAccountSupraCoinBalance(account: HexString): Promise<bigint> {
    return await this.getAccountCoinBalance(account, SUPRA_COIN_TYPE);
  }

  /**
   * Get Coin balance of given account
   * @param account Supra account address for getting balance
   * @param coinType Type of a coin resource
   * @returns Supra Balance
   */
  async getAccountCoinBalance(
    account: HexString,
    coinType: string
  ): Promise<bigint> {
    return BigInt(
      (
        await this.invokeViewMethod(
          "0x1::coin::balance",
          [coinType],
          [account.toString()]
        )
      )[0]
    );
  }

  /**
   * Invoke view method of the smart contract
   * @param functionFullName function full name refers to the module name + function name,
   * For instance `0x1::pbo_delegation_pool::get_stake`
   * @param typeArguments View function type arguments
   * @param functionArguments View function arguments
   * @returns Table item's data
   */
  async invokeViewMethod(
    functionFullName: string,
    typeArguments: Array<string>,
    functionArguments: Array<string>
  ): Promise<any> {
    return (
      await this.sendRequest({
        isGetMethod: false,
        subURL: "/rpc/v3/view",
        data: {
          function: functionFullName,
          type_arguments: typeArguments,
          arguments: functionArguments,
        },
      })
    ).data.result;
  }

  /**
   * Access item of table using associated key
   * @param tableHandle Table handle to access table item
   * @param keyType Type of the key
   * @param valueType Type of the value
   * @param key The actual key
   * @returns Table item's data
   */
  async getTableItemByKey(
    tableHandle: string,
    keyType: string,
    valueType: string,
    key: string
  ): Promise<any> {
    return (
      await this.sendRequest({
        isGetMethod: false,
        subURL: `/rpc/v3/tables/${tableHandle}/item`,
        data: {
          key_type: keyType,
          value_type: valueType,
          key: key,
        },
      })
    ).data;
  }

  private async waitForTransactionCompletion(
    txHash: string
  ): Promise<TransactionStatus> {
    for (let i = 0; i < MAX_RETRY_FOR_TRANSACTION_COMPLETION; i++) {
      let txStatus = await this.getTransactionStatus(txHash);
      if (!txStatus || txStatus === TransactionStatus.Pending) {
        await sleep(DELAY_BETWEEN_POOLING_REQUEST);
      } else {
        return txStatus;
      }
    }
    return TransactionStatus.Pending;
  }

  private async sendTx(
    sendTxJsonPayload: SendTxPayload,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    if (
      (enableTransactionWaitAndSimulationArgs?.enableTransactionSimulation ??
        DEFAULT_ENABLE_SIMULATION) === true
    ) {
      await this.simulateTx(sendTxJsonPayload);
    }

    let resData = await this.sendRequest({
      isGetMethod: false,
      subURL: "/rpc/v3/transactions/submit",
      data: sendTxJsonPayload,
    });
    console.log("Transaction Request Sent, Waiting For Completion");

    return {
      txHash: resData.data,
      result:
        (enableTransactionWaitAndSimulationArgs?.enableWaitForTransaction ??
          DEFAULT_WAIT_FOR_TX_COMPLETION) === true
          ? await this.waitForTransactionCompletion(resData.data)
          : TransactionStatus.Pending,
    };
  }

  /**
   * Generates signature message for supra transaction using `AnyRawTransaction`
   * @param rawTxn a RawTransaction, MultiAgentRawTransaction or FeePayerRawTransaction
   * @returns Signature message
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
        "hex"
      )
    );

    let rawTxSerializedData = new Uint8Array(BCS.bcsToBytes(rawTxn));
    let signatureMessage = new Uint8Array(
      preHash.length + rawTxSerializedData.length
    );
    signatureMessage.set(preHash);
    signatureMessage.set(rawTxSerializedData, preHash.length);
    return signatureMessage;
  }

  /**
   * Generates `ed25519_signature` for supra transaction using `AnyRawTransaction`
   * @param senderAccount the account to sign on the transaction
   * @param rawTxn a RawTransaction, MultiAgentRawTransaction or FeePayerRawTransaction
   * @returns ed25519 signature in `HexString`
   */
  static signSupraTransaction(
    senderAccount: SupraAccount,
    rawTxn: AnyRawTransaction
  ): HexString {
    return senderAccount.signBuffer(
      SupraClient.getSupraTransactionSignatureMessage(rawTxn)
    );
  }

  /**
   * Signs a multi transaction type (multi-agent / fee payer) and returns the
   * signer authenticator to be used to submit the transaction.
   * @param signer the account to sign on the transaction
   * @param rawTxn a MultiAgentRawTransaction or FeePayerRawTransaction
   * @returns signer authenticator
   */
  static signSupraMultiTransaction(
    signer: SupraAccount,
    rawTxn:
      | TxnBuilderTypes.MultiAgentRawTransaction
      | TxnBuilderTypes.FeePayerRawTransaction
  ): TxnBuilderTypes.AccountAuthenticatorEd25519 {
    const signerSignature = new TxnBuilderTypes.Ed25519Signature(
      SupraClient.signSupraTransaction(signer, rawTxn).toUint8Array()
    );
    return new TxnBuilderTypes.AccountAuthenticatorEd25519(
      new TxnBuilderTypes.Ed25519PublicKey(signer.signingKey.publicKey),
      signerSignature
    );
  }

  private getTransactionPayloadJSON(
    txPayload: TxnBuilderTypes.TransactionPayload
  ): TransactionPayloadJSON {
    if (txPayload instanceof TxnBuilderTypes.TransactionPayloadEntryFunction) {
      return {
        EntryFunction: {
          module: {
            address: txPayload.value.module_name.address
              .toHexString()
              .toString(),
            name: txPayload.value.module_name.name.value,
          },
          function: txPayload.value.function_name.value,
          ty_args: parseFunctionTypeArgs(txPayload.value.ty_args),
          args: fromUint8ArrayToJSArray(txPayload.value.args),
        },
      };
    } else if (txPayload instanceof TxnBuilderTypes.TransactionPayloadScript) {
      return {
        Script: {
          code: Array.from(txPayload.value.code),
          ty_args: parseFunctionTypeArgs(txPayload.value.ty_args),
          args: parseScriptArgs(txPayload.value.args),
        },
      };
    } else if (
      txPayload instanceof
      TxnBuilderTypes.TransactionPayloadAutomationRegistration
    ) {
      if (
        txPayload.value instanceof
        TxnBuilderTypes.AutomationRegistrationParamsV1
      ) {
        return {
          AutomationRegistration: {
            V1: {
              automated_function: {
                module: {
                  address:
                    txPayload.value.value.automated_function.module_name.address
                      .toHexString()
                      .toString(),
                  name: txPayload.value.value.automated_function.module_name
                    .name.value,
                },
                function:
                  txPayload.value.value.automated_function.function_name.value,
                ty_args: parseFunctionTypeArgs(
                  txPayload.value.value.automated_function.ty_args
                ),
                args: fromUint8ArrayToJSArray(
                  txPayload.value.value.automated_function.args
                ),
              },
              max_gas_amount: Number(txPayload.value.value.max_gas_amount),
              gas_price_cap: Number(txPayload.value.value.gas_price_cap),
              automation_fee_cap_for_epoch: Number(
                txPayload.value.value.automation_fee_cap_for_epoch
              ),
              expiration_timestamp_secs: Number(
                txPayload.value.value.expiration_timestamp_secs
              ),
              aux_data: fromUint8ArrayToJSArray(txPayload.value.value.aux_data),
            },
          },
        };
      } else {
        throw new Error("Unknown variant of `AutomationRegistrationParams`");
      }
    } else if (
      txPayload instanceof TxnBuilderTypes.TransactionPayloadMultisig
    ) {
      let multisig_address = txPayload.value.multisig_address
        .toHexString()
        .toString();
      let payload = txPayload.value.transaction_payload?.transaction_payload;
      const transaction_payload = payload
        ? {
            EntryFunction: {
              module: {
                address: payload.module_name.address.toHexString().toString(),
                name: payload.module_name.name.value,
              },
              function: payload.function_name.value,
              ty_args: parseFunctionTypeArgs(payload.ty_args),
              args: fromUint8ArrayToJSArray(payload.args),
            },
          }
        : undefined;

      return {
        Multisig: {
          multisig_address,
          transaction_payload,
        },
      };
    } else {
      throw new Error("Unknown variant of `TransactionPayload`");
    }
  }

  private getRawTxnJSON(rawTxn: TxnBuilderTypes.RawTransaction): RawTxnJSON {
    return {
      sender: rawTxn.sender.toHexString().toString(),
      sequence_number: Number(rawTxn.sequence_number),
      payload: this.getTransactionPayloadJSON(rawTxn.payload),
      max_gas_amount: Number(rawTxn.max_gas_amount),
      gas_unit_price: Number(rawTxn.gas_unit_price),
      expiration_timestamp_secs: Number(rawTxn.expiration_timestamp_secs),
      chain_id: rawTxn.chain_id.value,
    };
  }

  /**
   * Generate `SendTxPayload` using `RawTransaction` to send transaction request
   * Generated data can be used to send transaction directly using `/rpc/v3/transactions/submit` endpoint of `rpc_node`
   * @param senderAccount Sender KeyPair
   * @param rawTxn Raw transaction data
   * @returns `SendTxPayload`
   */
  getSendTxPayload(
    senderAccount: SupraAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ): SendTxPayload {
    return {
      Move: {
        raw_txn: this.getRawTxnJSON(rawTxn),
        authenticator: {
          Ed25519: {
            public_key: senderAccount.pubKey().toString(),
            signature: SupraClient.signSupraTransaction(
              senderAccount,
              rawTxn
            ).toString(),
          },
        },
      },
    };
  }

  /**
   * Send `entry_function_payload` type tx using serialized raw transaction data
   * @param senderAccount Sender KeyPair
   * @param serializedRawTransaction Serialized raw transaction data
   * @param enableTransactionWaitAndSimulationArgs enable transaction wait and simulation arguments
   * @returns `TransactionResponse`
   */
  async sendTxUsingSerializedRawTransaction(
    senderAccount: SupraAccount,
    serializedRawTransaction: Uint8Array,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    let sendTxPayload = this.getSendTxPayload(
      senderAccount,
      TxnBuilderTypes.RawTransaction.deserialize(
        new BCS.Deserializer(serializedRawTransaction)
      )
    );

    return await this.sendTx(
      sendTxPayload,
      enableTransactionWaitAndSimulationArgs
    );
  }

  /**
   * Send `entry_function_payload` type tx using serialized raw transaction data and ed25519 signature
   * @param senderPubkey Sender ed25519 pubkey
   * @param signature Ed25519 signature
   * @param serializedRawTransaction Serialized raw transaction data
   * @param enableTransactionWaitAndSimulationArgs enable transaction wait and simulation arguments
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
            signature: signature.toString(),
          },
        },
      },
    };

    return await this.sendTx(
      sendTxPayload,
      enableTransactionWaitAndSimulationArgs
    );
  }

  /**
   * Sends sponsor transaction
   * @param feePayerAddress Account address of tx fee payer
   * @param secondarySignersAccountAddress List of account address of tx secondary signers
   * @param rawTxn The raw transaction to be submitted
   * @param senderAuthenticator The sender account authenticator
   * @param feePayerAuthenticator The feepayer account authenticator
   * @param secondarySignersAuthenticator An optional array of the secondary signers account authenticator
   * @param enableTransactionWaitAndSimulationArgs enable transaction wait and simulation arguments
   * @returns `TransactionResponse`
   */
  async sendSponsorTransaction(
    feePayerAddress: string,
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    feePayerAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator: Array<TxnBuilderTypes.AccountAuthenticatorEd25519> = [],
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    let secondarySignersAuthenticatorJSON: Array<Ed25519AuthenticatorJSON> = [];
    secondarySignersAuthenticator.forEach((authenticator) => {
      secondarySignersAuthenticatorJSON.push(
        this.getED25519AuthenticatorJSON(authenticator)
      );
    });

    let sendTxPayload: SendTxPayload = {
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
            ),
          },
        },
      },
    };

    return await this.sendTx(
      sendTxPayload,
      enableTransactionWaitAndSimulationArgs
    );
  }

  /**
   * Sends multi-agent transaction
   * @param secondarySignersAccountAddress List of account address of tx secondary signers
   * @param rawTxn The raw transaction to be submitted
   * @param senderAuthenticator The sender account authenticator
   * @param secondarySignersAuthenticator List of the secondary signers account authenticator
   * @param enableTransactionWaitAndSimulationArgs enable transaction wait and simulation arguments
   * @returns `TransactionResponse`
   */
  async sendMultiAgentTransaction(
    secondarySignersAccountAddress: Array<string>,
    rawTxn: TxnBuilderTypes.RawTransaction,
    senderAuthenticator: TxnBuilderTypes.AccountAuthenticatorEd25519,
    secondarySignersAuthenticator: Array<TxnBuilderTypes.AccountAuthenticatorEd25519>,
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs
  ): Promise<TransactionResponse> {
    let secondarySignersAuthenticatorJSON: Array<Ed25519AuthenticatorJSON> = [];
    secondarySignersAuthenticator.forEach((authenticator) => {
      secondarySignersAuthenticatorJSON.push(
        this.getED25519AuthenticatorJSON(authenticator)
      );
    });

    let sendTxPayload: SendTxPayload = {
      Move: {
        raw_txn: this.getRawTxnJSON(rawTxn),
        authenticator: {
          MultiAgent: {
            sender: this.getED25519AuthenticatorJSON(senderAuthenticator),
            secondary_signer_addresses: secondarySignersAccountAddress,
            secondary_signers: secondarySignersAuthenticatorJSON,
          },
        },
      },
    };

    return await this.sendTx(
      sendTxPayload,
      enableTransactionWaitAndSimulationArgs
    );
  }

  private getED25519AuthenticatorJSON(
    authenticator: TxnBuilderTypes.AccountAuthenticatorEd25519
  ): Ed25519AuthenticatorJSON {
    return {
      Ed25519: {
        public_key: Buffer.from(authenticator.public_key.value).toString("hex"),
        signature: Buffer.from(authenticator.signature.value).toString("hex"),
      },
    };
  }

  private createRawTxObjectInner(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    payload: TxnBuilderTypes.TransactionPayload,
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): TxnBuilderTypes.RawTransaction {
    return new TxnBuilderTypes.RawTransaction(
      new TxnBuilderTypes.AccountAddress(senderAddr.toUint8Array()),
      senderSequenceNumber,
      payload,
      optionalTransactionPayloadArgs?.maxGas ?? DEFAULT_MAX_GAS_UNITS,
      optionalTransactionPayloadArgs?.gasUnitPrice ?? DEFAULT_GAS_PRICE,
      optionalTransactionPayloadArgs?.txExpiryTime ??
        BigInt(
          Math.ceil(Date.now() / MILLISECONDS_PER_SECOND) +
            DEFAULT_TX_EXPIRATION_DURATION
        ),
      this.chainId
    );
  }

  /**
   * Create raw transaction object for `entry_function_payload` type tx
   * @param senderAddr Sender account address
   * @param senderSequenceNumber Sender account sequence number
   * @param moduleAddr Target module address
   * @param moduleName Target module name
   * @param functionName Target function name
   * @param functionTypeArgs Target function type args
   * @param functionArgs Target function args
   * @param optionalTransactionPayloadArgs Optional arguments for transaction payload
   * @returns Raw transaction object
   * @example
   * ```typescript
   * let supraCoinTransferRawTransaction = await supraClient.createRawTxObject(
   *   senderAccount.address(),
   *   (
   *     await supraClient.getAccountInfo(senderAccount.address())
   *   ).sequence_number,
   *   "0000000000000000000000000000000000000000000000000000000000000001",
   *   "supra_account",
   *   "transfer",
   *   [],
   *   [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(10000)]
   * );
   * ```
   */
  async createRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Promise<TxnBuilderTypes.RawTransaction> {
    let payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
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
    );
    return this.createRawTxObjectInner(
      senderAddr,
      senderSequenceNumber,
      payload,
      optionalTransactionPayloadArgs
    );
  }

  /**
   * Create serialized raw transaction for `entry_function_payload` type tx
   * Under the hood the method utilizes `createRawTxObject` method to create a raw transaction
   * and then it serializes using bcs serializer
   * @param senderAddr Sender account address
   * @param senderSequenceNumber Sender account sequence number
   * @param moduleAddr Target module address
   * @param moduleName Target module name
   * @param functionName Target function name
   * @param functionTypeArgs Target function type args
   * @param functionArgs Target function args
   * @param optionalTransactionPayloadArgs Optional arguments for transaction payload
   * @returns Serialized raw transaction object
   */
  async createSerializedRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Promise<Uint8Array> {
    return BCS.bcsToBytes(
      await this.createRawTxObject(
        senderAddr,
        senderSequenceNumber,
        moduleAddr,
        moduleName,
        functionName,
        functionTypeArgs,
        functionArgs,
        optionalTransactionPayloadArgs
      )
    );
  }

  /**
   * Create serialized raw transaction for `script_payload` type tx
   * @param senderAddr Sender account address
   * @param senderSequenceNumber Sender account sequence number
   * @param scriptCode Move script bytecode
   * @param scriptTypeArgs Type arguments that move script bytecode requires
   * @param scriptArgs  Arguments to the move script bytecode function
   * @param optionalTransactionPayloadArgs Optional arguments for transaction payload
   * @returns Serialized raw transaction object
   */
  createSerializedScriptTxPayloadRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    scriptCode: Uint8Array,
    scriptTypeArgs: TxnBuilderTypes.TypeTag[],
    scriptArgs: TxnBuilderTypes.TransactionArgument[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Uint8Array {
    let payload = new TxnBuilderTypes.TransactionPayloadScript(
      new TxnBuilderTypes.Script(scriptCode, scriptTypeArgs, scriptArgs)
    );
    return BCS.bcsToBytes(
      this.createRawTxObjectInner(
        senderAddr,
        senderSequenceNumber,
        payload,
        optionalTransactionPayloadArgs
      )
    );
  }

  /**
   * Create serialized raw transaction object for `automation_registration_payload` type tx
   * @param senderAddr Sender account address
   * @param senderSequenceNumber Sender account sequence number
   * @param moduleAddr Target module address
   * @param moduleName Target module name
   * @param functionName Target function name
   * @param functionTypeArgs Target function type args
   * @param functionArgs Target function args
   * @param automation_max_gas_amount Max gas amount for automated transaction
   * @param automation_gas_price_cap Gas Uint price upper limit that user is willing to pay
   * @param automation_fee_cap_for_epoch Maximum automation fee that user is willing to pay for epoch.
   * @param automation_expiration_timestamp_secs Expiration time of the automated transaction in seconds since UTC Epoch start.
   * @param automation_aux_data Reserved for future extensions of registration parameters.
   * @param optionalTransactionPayloadArgs Optional arguments for transaction payload
   * @returns Serialized raw transaction object
   */
  createSerializedAutomationRegistrationTxPayloadRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    automation_max_gas_amount: bigint,
    automation_gas_price_cap: bigint,
    automation_fee_cap_for_epoch: bigint,
    automation_expiration_timestamp_secs: bigint,
    automation_aux_data: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Uint8Array {
    let payload = new TxnBuilderTypes.TransactionPayloadAutomationRegistration(
      new TxnBuilderTypes.AutomationRegistrationParamsV1(
        new TxnBuilderTypes.AutomationRegistrationParamsV1Data(
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
          ),
          automation_max_gas_amount,
          automation_gas_price_cap,
          automation_fee_cap_for_epoch,
          automation_expiration_timestamp_secs,
          automation_aux_data
        )
      )
    );
    return BCS.bcsToBytes(
      this.createRawTxObjectInner(
        senderAddr,
        senderSequenceNumber,
        payload,
        optionalTransactionPayloadArgs
      )
    );
  }

  /**
   * Create serialized raw transaction object for `multisig_payload` type tx
   * @param senderAddr Sender account address
   * @param senderSequenceNumber Sender account sequence number
   * @param multisigAddress Multisig account address
   * @param moduleAddr Target module address
   * @param moduleName Target module name
   * @param functionName Target function name
   * @param functionTypeArgs Target function type args
   * @param functionArgs Target function args
   * @param optionalTransactionPayloadArgs Optional arguments for transaction payload
   * @returns Serialized raw transaction object
   */
  createSerializedMultisigPayloadRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    multisigAddress: HexString,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Uint8Array {
    let payload = new TxnBuilderTypes.TransactionPayloadMultisig(
      new TxnBuilderTypes.MultiSig(
        TxnBuilderTypes.AccountAddress.fromHex(multisigAddress),
        new TxnBuilderTypes.MultiSigTransactionPayload(
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
        )
      )
    );
    return BCS.bcsToBytes(
      this.createRawTxObjectInner(
        senderAddr,
        senderSequenceNumber,
        payload,
        optionalTransactionPayloadArgs
      )
    );
  }

  /**
   * Create serialized raw transaction object to create multisig transaction
   * @param senderAddr Sender account address
   * @param senderSequenceNumber Sender account sequence number
   * @param multisigAddress Multisig account address
   * @param moduleAddr Target module address
   * @param moduleName Target module name
   * @param functionName Target function name
   * @param functionTypeArgs Target function type args
   * @param functionArgs Target function args
   * @param optionalTransactionPayloadArgs Optional arguments for transaction payload
   * @returns Serialized raw transaction object
   */
  async createSerializedRawTxObjectToCreateMultisigTx(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    multisigAddress: HexString,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs
  ): Promise<Uint8Array> {
    let multisigPayload = new TxnBuilderTypes.MultiSigTransactionPayload(
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
    );
    let multisigPayloadHash = new HexString(
      sha3.sha3_256(BCS.bcsToBytes(multisigPayload))
    );

    return await this.createSerializedRawTxObject(
      senderAddr,
      senderSequenceNumber,
      SUPRA_FRAMEWORK_ADDRESS,
      "multisig_account",
      "create_transaction_with_hash",
      [],
      [
        BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(multisigAddress)),
        BCS.bcsSerializeBytes(multisigPayloadHash.toUint8Array()),
      ],
      optionalTransactionPayloadArgs
    );
  }

  /**
   * Create signed transaction payload
   * @param senderAccount Sender KeyPair
   * @param rawTxn Raw transaction payload
   * @returns `SignedTransaction`
   */
  static createSignedTransaction(
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
    );
  }

  /**
   * Generate transaction hash locally
   * @param signedTransaction Signed transaction payload
   * @returns `SignedTransaction`
   * @example
   * ```typescript
   *  let supraCoinTransferSignedTransaction = SupraClient.createSignedTransaction(
   *     senderAccount,
   *     supraCoinTransferRawTransaction
   *  );
   *  console.log(
   *     SupraClient.deriveTransactionHash(supraCoinTransferSignedTransaction)
   *  );
   * ```
   */
  static deriveTransactionHash(
    signedTransaction: TxnBuilderTypes.SignedTransaction
  ): string {
    return sha3.keccak256(BCS.bcsToBytes(signedTransaction));
  }

  /**
   * Transfer supra coin
   * @param senderAccount Sender KeyPair
   * @param receiverAccountAddr Receiver Supra Account address
   * @param amount Amount to transfer
   * @param optionalTransactionArgs optional arguments for transaction
   * @returns `TransactionResponse`
   */
  async transferSupraCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    optionalTransactionArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    if (
      optionalTransactionArgs?.optionalTransactionPayloadArgs &&
      !optionalTransactionArgs?.optionalTransactionPayloadArgs?.maxGas
    ) {
      let maxGas = BigInt(
        DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_EXISTS
      );
      if ((await this.isAccountExists(receiverAccountAddr)) === false) {
        maxGas = BigInt(
          DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_NOT_EXISTS
        );
      }
      optionalTransactionArgs.optionalTransactionPayloadArgs.maxGas = maxGas;
    }

    let sendTxPayload = this.getSendTxPayload(
      senderAccount,
      await this.createRawTxObject(
        senderAccount.address(),
        (
          await this.getAccountInfo(senderAccount.address())
        ).sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        "supra_account",
        "transfer",
        [],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)],
        optionalTransactionArgs?.optionalTransactionPayloadArgs
      )
    );

    return await this.sendTx(
      sendTxPayload,
      optionalTransactionArgs?.enableTransactionWaitAndSimulationArgs
    );
  }

  /**
   * Transfer custom type of coin
   * @param senderAccount Sender KeyPair
   * @param receiverAccountAddr Receiver Supra Account address
   * @param amount Amount to transfer
   * @param coinType Type of custom coin
   * @param optionalTransactionArgs optional arguments for transaction
   * @returns `TransactionResponse`
   */
  async transferCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    coinType: string,
    optionalTransactionArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    let sendTxPayload = this.getSendTxPayload(
      senderAccount,
      await this.createRawTxObject(
        senderAccount.address(),
        (
          await this.getAccountInfo(senderAccount.address())
        ).sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        "supra_account",
        "transfer_coins",
        [new TxnBuilderTypes.TypeTagParser(coinType).parseTypeTag()],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)],
        optionalTransactionArgs?.optionalTransactionPayloadArgs
      )
    );

    return await this.sendTx(
      sendTxPayload,
      optionalTransactionArgs?.enableTransactionWaitAndSimulationArgs
    );
  }

  /**
   * Publish package or module on supra network
   * @param senderAccount Module Publisher KeyPair
   * @param packageMetadata Package Metadata
   * @param modulesCode module code
   * @param optionalTransactionArgs optional arguments for transaction
   * @returns `TransactionResponse`
   */
  async publishPackage(
    senderAccount: SupraAccount,
    packageMetadata: Uint8Array,
    modulesCode: Uint8Array[],
    optionalTransactionArgs?: OptionalTransactionArgs
  ): Promise<TransactionResponse> {
    let codeSerializer = new BCS.Serializer();
    let modulesTypeCode: TxnBuilderTypes.Module[] = [];
    for (let i = 0; i < modulesCode.length; i++) {
      modulesTypeCode.push(
        new TxnBuilderTypes.Module(Uint8Array.from(modulesCode[i]))
      );
    }
    BCS.serializeVector(modulesTypeCode, codeSerializer);

    let sendTxPayload = this.getSendTxPayload(
      senderAccount,
      await this.createRawTxObject(
        senderAccount.address(),
        (
          await this.getAccountInfo(senderAccount.address())
        ).sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        "code",
        "publish_package_txn",
        [],
        [BCS.bcsSerializeBytes(packageMetadata), codeSerializer.getBytes()],
        optionalTransactionArgs?.optionalTransactionPayloadArgs
      )
    );

    return await this.sendTx(
      sendTxPayload,
      optionalTransactionArgs?.enableTransactionWaitAndSimulationArgs
    );
  }

  /**
   * Simulate a transaction using the provided transaction payload
   * @param sendTxPayload Transaction payload
   * @returns Transaction simulation result
   */
  async simulateTx(sendTxPayload: SendTxPayload): Promise<any> {
    let txAuthenticatorWithValidSignatures = sendTxPayload.Move.authenticator;
    let txAuthenticatorClone = JSON.parse(
      JSON.stringify(txAuthenticatorWithValidSignatures)
    );
    sendTxPayload.Move.authenticator = txAuthenticatorClone;
    this.unsetAuthenticatorSignatures(sendTxPayload.Move.authenticator);
    let resData = await this.sendRequest({
      isGetMethod: false,
      subURL: "/rpc/v3/transactions/simulate",
      data: sendTxPayload,
    });

    sendTxPayload.Move.authenticator = txAuthenticatorWithValidSignatures;
    if (resData.data.output.Move.vm_status !== "Executed successfully") {
      throw new Error(
        `Transaction simulation failed. Reason: ${resData?.data?.output?.Move?.vm_status}`
      );
    }
    console.log("Transaction Simulation Done");
    return resData.data;
  }

  private unsetAuthenticatorSignatures(txAuthenticator: AnyAuthenticatorJSON) {
    let nullSignature = "0x" + "0".repeat(128);
    if ("Ed25519" in txAuthenticator) {
      txAuthenticator.Ed25519.signature = nullSignature;
    } else if ("FeePayer" in txAuthenticator) {
      txAuthenticator.FeePayer.sender.Ed25519.signature = nullSignature;
      txAuthenticator.FeePayer.fee_payer_signer.Ed25519.signature =
        nullSignature;
      txAuthenticator.FeePayer.secondary_signers.forEach(
        (ed25519Authenticator) => {
          ed25519Authenticator.Ed25519.signature = nullSignature;
        }
      );
    } else {
      txAuthenticator.MultiAgent.sender.Ed25519.signature = nullSignature;
      txAuthenticator.MultiAgent.secondary_signers.forEach(
        (ed25519Authenticator) => {
          ed25519Authenticator.Ed25519.signature = nullSignature;
        }
      );
    }
  }

  /**
   * Simulate a transaction using the provided Serialized raw transaction data
   * @param txAuthenticator Transaction authenticator
   * @param serializedRawTransaction Serialized raw transaction data
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
        authenticator: txAuthenticator,
      },
    };

    return await this.simulateTx(sendTxPayload);
  }
}
