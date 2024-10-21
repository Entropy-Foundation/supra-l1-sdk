import {
  TxnBuilderTypes,
  BCS,
  HexString,
  AptosAccount as SupraAccount,
} from "aptos";
import axios, { AxiosResponse } from "axios";
import {
  normalizeAddress,
  fromUint8ArrayToJSArray,
  sleep,
  parseFunctionTypeArgs,
} from "./utils";
import {
  TransactionStatus,
  TransactionResponse,
  TransactionDetail,
  SendTxPayload,
  AccountInfo,
  AccountResources,
  TransactionInsights,
  TxTypeForTransactionInsights,
  CoinInfo,
  CoinChange,
  FaucetRequestResponse,
} from "./types";
import {
  DEFAULT_CHAIN_ID,
  DEFAULT_ENABLE_SIMULATION,
  DEFAULT_GAS_UNIT_PRICE,
  DEFAULT_MAX_GAS_UNITS,
  DEFAULT_RECORDS_ITEMS_COUNT,
  DEFAULT_TX_EXPIRATION_DURATION,
  DEFAULT_WAIT_FOR_TX_COMPLETION,
  DELAY_BETWEEN_POOLING_REQUEST,
  MAX_RETRY_FOR_TRANSACTION_COMPLETION,
  MILLISECONDS_PER_SECOND,
  SUPRA_FRAMEWORK_ADDRESS,
} from "./constants";
import { sha3_256 } from "js-sha3";

export * from "./types";
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
   * @param url rpc url of supra rpc node
   * @returns `SupraClient` initialized instance
   */
  static async init(url: string): Promise<SupraClient> {
    let supraClient = new SupraClient(url);
    supraClient.chainId = await supraClient.getChainId();
    return supraClient;
  }

  private async sendRequest(
    isGetMethod: boolean,
    subURL: string,
    data?: any
  ): Promise<AxiosResponse<any, any>> {
    let resData;
    if (isGetMethod == true) {
      resData = await axios({
        method: "get",
        baseURL: this.supraNodeURL,
        url: subURL,
      });
    } else {
      if (data == undefined) {
        throw new Error("For Post Request 'data' Should Not Be 'undefined'");
      }
      resData = await axios({
        method: "post",
        baseURL: this.supraNodeURL,
        url: subURL,
        data: data,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    if (resData.status == 404) {
      throw new Error("Invalid URL, Path Not Found");
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
        (await this.sendRequest(true, "/rpc/v1/transactions/chain_id")).data
      )
    );
  }

  /**
   * Get current `mean_gas_price`
   * @returns Current `mean_gas_price`
   */
  async getGasPrice(): Promise<bigint> {
    return BigInt(
      (await this.sendRequest(true, "/rpc/v1/transactions/estimate_gas_price"))
        .data.mean_gas_price
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
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/wallet/faucet/${account.toString()}`
    );

    if (typeof resData.data === "object") {
      if (resData.data.hasOwnProperty("Accepted")) {
        return {
          status: await this.waitForTransactionCompletion(
            resData.data.Accepted
          ),
          transactionHash: resData.data.Accepted,
        };
      } else {
        throw new Error(
          "something went wrong, getting unexpected response from rpc_node"
        );
      }
    } else {
      throw new Error("try faucet later");
    }
  }

  /**
   * Check whether given account exists onchain or not
   * @param account Hex-encoded 32 byte Supra account address
   * @returns `true` if account exists otherwise `false`
   */
  async isAccountExists(account: HexString): Promise<boolean> {
    if (
      (await this.sendRequest(true, `/rpc/v1/accounts/${account.toString()}`))
        .data == null
    ) {
      return false;
    }
    return true;
  }

  /**
   * Get info of given supra account
   * @param account Hex-encoded 32 byte Supra account address
   * @returns `AccountInfo`
   */
  async getAccountInfo(account: HexString): Promise<AccountInfo> {
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/accounts/${account.toString()}`
    );

    if (resData.data == null) {
      throw new Error("Account Not Exists, Or Invalid Account Is Passed");
    }
    return {
      sequence_number: BigInt(resData.data.sequence_number),
      authentication_key: resData.data.authentication_key,
    };
  }

  /**
   * Get list of all resources held by given supra account
   * @param account Hex-encoded 32 byte Supra account address
   * @returns `AccountResources`
   */
  async getAccountResources(account: HexString): Promise<AccountResources> {
    return (
      await this.sendRequest(
        true,
        `/rpc/v1/accounts/${account.toString()}/resources`
      )
    ).data.resources as AccountResources;
  }

  /**
   * Get data of resource held by given supra account
   * @param account Hex-encoded 32 byte Supra account address
   * @param resourceType Type of a resource
   * @returns Resource data
   */
  async getResourceData(
    account: HexString,
    resourceType: string
  ): Promise<any> {
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/accounts/${account.toString()}/resources/${resourceType}`
    );

    if (resData.data.result[0] == null) {
      throw new Error("Resource not found");
    }
    return resData.data.result[0];
  }

  /**
   * Get status of given supra transaction
   * @param transactionHash Hex-encoded 32 byte transaction hash for getting transaction status
   * @returns `TransactionStatus`
   */
  async getTransactionStatus(
    transactionHash: string
  ): Promise<TransactionStatus | null> {
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/transactions/${transactionHash}`
    );
    if (resData.data == null) {
      return null;
    }

    return resData.data.status == "Unexecuted"
      ? "Pending"
      : resData.data.status == "Fail"
      ? "Failed"
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
      type: TxTypeForTransactionInsights.ScriptCall,
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
          coinType: "0x1::supra_coin::SupraCoin",
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
        txInsights.type = TxTypeForTransactionInsights.EntryFunctionCall;
      }
    } else if (
      txData.status === TransactionStatus.Success &&
      txData.payload.Move.type === "script_payload"
    ) {
      txInsights.coinChange = this.getCoinChangeAmount(
        userAddress,
        txData.output.Move.events
      );
    } else {
      throw new Error(
        "something went wrong, found unsupported type of transaction"
      );
    }
    return txInsights;
  }

  /**
   * Get transaction details of given transaction hash
   * @param account Hex-encoded 32 byte Supra account address
   * @param transactionHash Hex-encoded 32 byte transaction hash for getting transaction details
   * @returns `TransactionDetail`
   */
  async getTransactionDetail(
    account: HexString,
    transactionHash: string
  ): Promise<TransactionDetail | null> {
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/transactions/${transactionHash}`
    );

    if (resData.data == null) {
      return null;
    }

    // Added Patch to resolve inconsistencies issue of `rpc_node` 
    if (
      resData.data.status === TransactionStatus.Pending ||
      resData.data.output === null ||
      resData.data.header
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
        resData.data.status == "Fail" || resData.data.status == "Invalid"
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
   * @param count Number of transactions details
   * @param start Cursor for pagination based response
   * @returns List of `TransactionDetail`
   */
  async getAccountTransactionsDetail(
    account: HexString,
    count: number = DEFAULT_RECORDS_ITEMS_COUNT,
    start: number | null = null
  ): Promise<TransactionDetail[]> {
    let requestPath = `/rpc/v1/accounts/${account.toString()}/transactions?count=${count}`;
    if (start != null) {
      requestPath += `&start=${start}`;
    }
    let resData = await this.sendRequest(true, requestPath);
    if (resData.data.record == null) {
      throw new Error("Account Not Exists, Or Invalid Account Is Passed");
    }

    let accountTransactionsDetail: TransactionDetail[] = [];
    resData.data.record.forEach((data: any) => {
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
   * @param count Number of transactions details
   * @param start Cursor for pagination based response
   * @returns List of `TransactionDetail`
   */
  async getCoinTransactionsDetail(
    account: HexString,
    count: number = DEFAULT_RECORDS_ITEMS_COUNT,
    start: number | null = null
  ): Promise<TransactionDetail[]> {
    let requestPath = `/rpc/v1/accounts/${account.toString()}/coin_transactions?count=${count}`;
    if (start != null) {
      requestPath += `&start=${start}`;
    }

    let resData = await this.sendRequest(true, requestPath);
    if (resData.data.record == null) {
      throw new Error("Account Not Exists, Or Invalid Account Is Passed");
    }

    let coinTransactionsDetail: TransactionDetail[] = [];
    resData.data.record.forEach((data: any) => {
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
    let coinTransactions = await this.sendRequest(
      true,
      `/rpc/v1/accounts/${account.toString()}/coin_transactions?count=${count}`
    );
    let accountSendedTransactions = await this.sendRequest(
      true,
      `/rpc/v1/accounts/${account.toString()}/transactions?count=${count}`
    );

    let combinedTxArray: any[] = [];
    if (coinTransactions.data.record != null) {
      combinedTxArray.push(...coinTransactions.data.record);
    }
    if (accountSendedTransactions.data.record != null) {
      combinedTxArray.push(...accountSendedTransactions.data.record);
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
   * Get Supra balance of given account
   * @param coinType Type of a coin resource
   * @returns CoinInfo
   */
  async getCoinInfo(coinType: string): Promise<CoinInfo> {
    let coinInfoResource = await this.getResourceData(
      new HexString(coinType.substring(2, 66)),
      `${SUPRA_FRAMEWORK_ADDRESS}::coin::CoinInfo<${coinType}>`
    );
    return {
      name: coinInfoResource.name,
      symbol: coinInfoResource.symbol,
      decimals: coinInfoResource.decimals,
    };
  }

  /**
   * Get Supra balance of given account
   * @param account Supra Account address for getting balance
   * @returns Supra Balance
   */
  async getAccountSupraCoinBalance(account: HexString): Promise<bigint> {
    return BigInt(
      (
        await this.getResourceData(
          account,
          "0x1::coin::CoinStore<0x1::supra_coin::SupraCoin>"
        )
      ).coin.value
    );
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
      (await this.getResourceData(account, `0x1::coin::CoinStore<${coinType}>`))
        .coin.value
    );
  }

  private async waitForTransactionCompletion(
    txHash: string
  ): Promise<TransactionStatus> {
    for (let i = 0; i < MAX_RETRY_FOR_TRANSACTION_COMPLETION; i++) {
      let txStatus = await this.getTransactionStatus(txHash);
      if (txStatus === null || txStatus == TransactionStatus.Pending) {
        await sleep(DELAY_BETWEEN_POOLING_REQUEST);
      } else {
        return txStatus;
      }
    }
    return TransactionStatus.Pending;
  }

  private async sendTx(
    sendTxJsonPayload: SendTxPayload,
    enableSimulation: boolean = DEFAULT_ENABLE_SIMULATION,
    waitForTransactionCompletion: boolean = DEFAULT_WAIT_FOR_TX_COMPLETION
  ): Promise<TransactionResponse> {
    if (enableSimulation === true) {
      await this.simulateTx(sendTxJsonPayload);
    }

    let resData = await this.sendRequest(
      false,
      "/rpc/v1/transactions/submit",
      sendTxJsonPayload
    );
    console.log("Transaction Request Sent, Waiting For Completion");

    return {
      txHash: resData.data,
      result:
        waitForTransactionCompletion === true
          ? await this.waitForTransactionCompletion(resData.data)
          : TransactionStatus.Pending,
    };
  }

  private signSupraTransaction(
    senderAccount: SupraAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ) {
    let preHash = Uint8Array.from(
      Buffer.from(sha3_256("SUPRA::RawTransaction"), "hex")
    );

    let serializer = new BCS.Serializer();
    rawTxn.serialize(serializer);
    let rawTxSerializedData = new Uint8Array(serializer.getBytes());

    let signatureMessage = new Uint8Array(
      preHash.length + rawTxSerializedData.length
    );
    signatureMessage.set(preHash);
    signatureMessage.set(rawTxSerializedData, preHash.length);
    return senderAccount.signBuffer(signatureMessage).toString();
  }

  private getRawTxDataInJson(
    senderAccountAddress: HexString,
    rawTxn: TxnBuilderTypes.RawTransaction
  ): any {
    let txPayload = (
      rawTxn.payload as TxnBuilderTypes.TransactionPayloadEntryFunction
    ).value;

    return {
      sender: senderAccountAddress.toString(),
      sequence_number: Number(rawTxn.sequence_number),
      payload: {
        EntryFunction: {
          module: {
            address: txPayload.module_name.address.toHexString().toString(),
            name: txPayload.module_name.name.value,
          },
          function: txPayload.function_name.value,
          ty_args: parseFunctionTypeArgs(txPayload.ty_args),
          args: fromUint8ArrayToJSArray(txPayload.args),
        },
      },
      max_gas_amount: Number(rawTxn.max_gas_amount),
      gas_unit_price: Number(rawTxn.gas_unit_price),
      expiration_timestamp_secs: Number(rawTxn.expiration_timestamp_secs),
      chain_id: rawTxn.chain_id.value,
    };
  }

  private async getSendTxPayload(
    senderAccount: SupraAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ): Promise<SendTxPayload> {
    return {
      Move: {
        raw_txn: this.getRawTxDataInJson(senderAccount.address(), rawTxn),
        authenticator: {
          Ed25519: {
            public_key: senderAccount.pubKey().toString(),
            signature: this.signSupraTransaction(senderAccount, rawTxn),
          },
        },
      },
    };
  }

  /**
   * Send `entry_function_payload` type tx using serialized raw transaction data
   * @param senderAccount Sender KeyPair
   * @param serializedRawTransaction Serialized raw transaction data
   * @param enableSimulation should enable simulation
   * @param waitForTransactionCompletion should wait for transaction completion
   * @returns `TransactionResponse`
   */
  async sendTxUsingSerializedRawTransaction(
    senderAccount: SupraAccount,
    serializedRawTransaction: Uint8Array,
    enableSimulation: boolean = DEFAULT_ENABLE_SIMULATION,
    waitForTransactionCompletion: boolean = DEFAULT_WAIT_FOR_TX_COMPLETION
  ): Promise<TransactionResponse> {
    let sendTxPayload = await this.getSendTxPayload(
      senderAccount,
      TxnBuilderTypes.RawTransaction.deserialize(
        new BCS.Deserializer(serializedRawTransaction)
      )
    );

    return await this.sendTx(
      sendTxPayload,
      enableSimulation,
      waitForTransactionCompletion
    );
  }

  static async createRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    chainId: TxnBuilderTypes.ChainId,
    maxGas: bigint | undefined = DEFAULT_MAX_GAS_UNITS,
    gasUnitPrice: bigint | undefined = DEFAULT_GAS_UNIT_PRICE,
    txExpiryTime: bigint | undefined = undefined
  ): Promise<TxnBuilderTypes.RawTransaction> {
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
      maxGas,
      gasUnitPrice,
      txExpiryTime === undefined
        ? BigInt(
            Math.ceil(Date.now() / MILLISECONDS_PER_SECOND) +
              DEFAULT_TX_EXPIRATION_DURATION
          )
        : txExpiryTime,
      chainId
    );
  }

  /**
   * Create serialized raw transaction object for `entry_function_payload` type tx
   * @param senderAddr Sender account address
   * @param senderSequenceNumber Sender account sequence number
   * @param moduleAddr Target module address
   * @param moduleName Target module name
   * @param functionName Target function name
   * @param functionTypeArgs Target function type args
   * @param functionArgs Target function args
   * @param chainId Supra network chain id
   * @param maxGas Maximum gas for transaction
   * @param gasUnitPrice Maximum gas unit price for transaction
   * @param txExpiryTime Expiry time for transaction
   * @returns Serialized raw transaction object
   */
  static async createSerializedRawTxObject(
    senderAddr: HexString,
    senderSequenceNumber: bigint,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: TxnBuilderTypes.TypeTag[],
    functionArgs: Uint8Array[],
    chainId: TxnBuilderTypes.ChainId,
    maxGas: bigint = DEFAULT_MAX_GAS_UNITS,
    gasUnitPrice: bigint = DEFAULT_GAS_UNIT_PRICE,
    txExpiryTime: bigint | undefined = undefined
  ): Promise<Uint8Array> {
    return BCS.bcsToBytes(
      await SupraClient.createRawTxObject(
        senderAddr,
        senderSequenceNumber,
        moduleAddr,
        moduleName,
        functionName,
        functionTypeArgs,
        functionArgs,
        chainId,
        maxGas,
        gasUnitPrice,
        txExpiryTime === undefined
          ? BigInt(
              Math.ceil(Date.now() / MILLISECONDS_PER_SECOND) +
                DEFAULT_TX_EXPIRATION_DURATION
            )
          : txExpiryTime
      )
    );
  }

  /**
   * Transfer supra coin
   * @param senderAccount Sender KeyPair
   * @param receiverAccountAddr Receiver Supra Account address
   * @param amount Amount to transfer
   * @param enableSimulation should enable simulation
   * @param waitForTransactionCompletion should wait for transaction completion
   * @returns `TransactionResponse`
   */
  async transferSupraCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    enableSimulation: boolean = DEFAULT_ENABLE_SIMULATION,
    waitForTransactionCompletion: boolean = DEFAULT_WAIT_FOR_TX_COMPLETION
  ): Promise<TransactionResponse> {
    let maxGas = BigInt(10);
    if ((await this.isAccountExists(receiverAccountAddr)) == false) {
      maxGas = BigInt(1020);
    }
    // Note: Here We Are Checking Whether User Have SupraCoin Balance More Than AmountToSend + Expected Tx Cost.
    // As Per Our Assumption The Gas Usage For Coin Transfer Will Be 6 When Receiver Account Exists But Despite Of That We Will Set maxGas Value As 10.
    // Along With This As Per Our Assumption Expected Gas Usage For Coin Transfer Will Be 1009 When Receiver Account Not Exists,
    // But Despite That We Will Set maxGas Value As 1020 For That Type Of Transaction.
    if (
      amount + maxGas * BigInt(100) >
      (await this.getAccountSupraCoinBalance(senderAccount.address()))
    ) {
      throw new Error("Insufficient Supra Coins");
    }
    let sendTxPayload = await this.getSendTxPayload(
      senderAccount,
      await SupraClient.createRawTxObject(
        senderAccount.address(),
        (
          await this.getAccountInfo(senderAccount.address())
        ).sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        "supra_account",
        "transfer",
        [],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)],
        this.chainId,
        maxGas
      )
    );

    return await this.sendTx(
      sendTxPayload,
      enableSimulation,
      waitForTransactionCompletion
    );
  }

  /**
   * Transfer coin
   * @param senderAccount Sender KeyPair
   * @param receiverAccountAddr Receiver Supra Account address
   * @param amount Amount to transfer
   * @param coinType Type of coin
   * @param enableSimulation should enable simulation
   * @param waitForTransactionCompletion should wait for transaction completion
   * @returns `TransactionResponse`
   */
  async transferCoin(
    senderAccount: SupraAccount,
    receiverAccountAddr: HexString,
    amount: bigint,
    coinType: string,
    enableSimulation: boolean = DEFAULT_ENABLE_SIMULATION,
    waitForTransactionCompletion: boolean = DEFAULT_WAIT_FOR_TX_COMPLETION
  ): Promise<TransactionResponse> {
    let maxGas = BigInt(50000);
    if (
      BigInt(0) + maxGas * BigInt(100) >
      (await this.getAccountSupraCoinBalance(senderAccount.address()))
    ) {
      throw new Error("Insufficient Supra Coins");
    }
    if (
      BigInt(amount) >
      (await this.getAccountCoinBalance(senderAccount.address(), coinType))
    ) {
      throw new Error("Insufficient Coins To Transfer");
    }
    let sendTxPayload = await this.getSendTxPayload(
      senderAccount,
      await SupraClient.createRawTxObject(
        senderAccount.address(),
        (
          await this.getAccountInfo(senderAccount.address())
        ).sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        "supra_account",
        "transfer_coins",
        [new TxnBuilderTypes.TypeTagParser(coinType).parseTypeTag()],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)],
        this.chainId,
        maxGas
      )
    );

    return await this.sendTx(
      sendTxPayload,
      enableSimulation,
      waitForTransactionCompletion
    );
  }

  /**
   * Publish package or module on supra network
   * @param senderAccount Module Publisher KeyPair
   * @param packageMetadata Package Metadata
   * @param modulesCode module code
   * @param enableSimulation should enable simulation
   * @param waitForTransactionCompletion should wait for transaction completion
   * @returns `TransactionResponse`
   */
  async publishPackage(
    senderAccount: SupraAccount,
    packageMetadata: Uint8Array,
    modulesCode: Uint8Array[],
    enableSimulation: boolean = DEFAULT_ENABLE_SIMULATION,
    waitForTransactionCompletion: boolean = DEFAULT_WAIT_FOR_TX_COMPLETION
  ): Promise<TransactionResponse> {
    let codeSerializer = new BCS.Serializer();
    let modulesTypeCode: TxnBuilderTypes.Module[] = [];
    for (let i = 0; i < modulesCode.length; i++) {
      modulesTypeCode.push(
        new TxnBuilderTypes.Module(Uint8Array.from(modulesCode[i]))
      );
    }
    BCS.serializeVector(modulesTypeCode, codeSerializer);
    let sendTxPayload = await this.getSendTxPayload(
      senderAccount,
      await SupraClient.createRawTxObject(
        senderAccount.address(),
        (
          await this.getAccountInfo(senderAccount.address())
        ).sequence_number,
        SUPRA_FRAMEWORK_ADDRESS,
        "code",
        "publish_package_txn",
        [],
        [BCS.bcsSerializeBytes(packageMetadata), codeSerializer.getBytes()],
        this.chainId
      )
    );

    return await this.sendTx(
      sendTxPayload,
      enableSimulation,
      waitForTransactionCompletion
    );
  }

  /**
   * Simulate a transaction using the provided transaction payload
   * @param sendTxPayload Transaction payload
   */
  async simulateTx(sendTxPayload: SendTxPayload): Promise<any> {
    let resData = await this.sendRequest(
      false,
      "/rpc/v1/transactions/simulate",
      sendTxPayload
    );

    if (resData.data.output.Move.vm_status !== "Executed successfully") {
      throw new Error(
        "Transaction Can Be Failed, Reason: " +
          resData.data.output.Move.vm_status
      );
    }
    console.log("Transaction Simulation Done");
    return resData.data;
  }

  /**
   * Simulate a transaction using the provided Serialized raw transaction data
   * @param senderAccountAddress Tx sender account address
   * @param serializedRawTransaction Serialized raw transaction data
   */
  async simulateTxUsingSerializedRawTransaction(
    senderAccountAddress: HexString,
    senderAccountPubKey: HexString,
    serializedRawTransaction: Uint8Array
  ): Promise<any> {
    let sendTxPayload = {
      Move: {
        raw_txn: this.getRawTxDataInJson(
          senderAccountAddress,
          TxnBuilderTypes.RawTransaction.deserialize(
            new BCS.Deserializer(serializedRawTransaction)
          )
        ),
        authenticator: {
          Ed25519: {
            public_key: senderAccountPubKey.toString(),
            signature: "0".repeat(128),
          },
        },
      },
    };

    return await this.simulateTx(sendTxPayload);
  }
}
