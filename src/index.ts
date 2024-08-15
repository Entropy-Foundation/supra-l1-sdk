import {
  TxnBuilderTypes,
  BCS,
  HexString,
  AptosAccount,
  TransactionBuilder,
} from "aptos";
import axios, { AxiosResponse } from "axios";
import { normalizeAddress, fromUint8ArrayToJSArray, sleep } from "./utils";
import {
  TransactionStatus,
  TransactionResponse,
  TransactionDetail,
  SendTxPayload,
  AccountInfo,
  AccountResources,
  TransactionInsights,
  TxTypeForTransactionInsights,
} from "./types";

export * from "./types";

/**
 * Provides methods for interacting with supra rpc node.
 */
export class SupraClient {
  supraNodeURL: string;
  chainId: TxnBuilderTypes.ChainId;
  requestTimeout = 10000; // 10 Seconds
  maxRetryForTransactionCompletion = 60;
  delayBetweenPoolingRequest = 1000; // 1 Second

  constructor(url: string, chainId: number = Number(3)) {
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
        timeout: this.requestTimeout,
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
        timeout: this.requestTimeout,
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
   * Get current mean_gas_price
   * @returns Current mean_gas_price
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
   * @returns Transaction hash of faucet transaction
   */
  async fundAccountWithFaucet(account: HexString): Promise<string[]> {
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/wallet/faucet/${account.toString()}`
    );

    let txHashes: string[];
    if (typeof resData.data === "object") {
      if (resData.data.hasOwnProperty("Accepted")) {
        txHashes = [resData.data.Accepted];
        await this.waitForTransactionCompletion(txHashes[0]);
        return txHashes;
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
   * @returns true if account exists otherwise false
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
   * Get resources of given supra account
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
   * Get given supra account's resource data
   * @param account Hex-encoded 32 byte Supra account address
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

  private getSupraCoinChangeAmount(userAddress: string, events: any[]): number {
    let amountChange = 0;
    console.log(events);

    events.forEach((eventData) => {
      if (
        eventData.data.account === userAddress &&
        (eventData.type === "0x1::coin::CoinDeposit" ||
          eventData.type === "0x1::coin::CoinWithdraw")
      ) {
        // if (eventData.data.data.coin_type === "0x1::supra_coin::SupraCoin") {

        // }
        if (eventData.type === "0x1::coin::CoinDeposit") {
          console.log(eventData.data.amount);
          amountChange += parseInt(eventData.data.amount);
        } else if (eventData.type === "0x1::coin::CoinWithdraw") {
          eventData.data.amount;
          amountChange -= parseInt(eventData.data.amount);
        }
      }
    });
    return amountChange;
  }

  private getTransactionInsights(
    userAddress: string,
    txData: any
  ): TransactionInsights {
    let txInsights: TransactionInsights = {
      supraCoinReceiver: "",
      supraCoinChangeAmount: 0,
      type: TxTypeForTransactionInsights.MoveCall,
    };

    if (txData.payload.Move.type === "entry_function_payload") {
      if (txData.payload.Move.function === "0x1::aptos_account::transfer") {
        txInsights.supraCoinReceiver = txData.payload.Move.arguments[0];
        txInsights.supraCoinChangeAmount = parseInt(
          txData.payload.Move.arguments[1]
        );
        txInsights.type = TxTypeForTransactionInsights.SupraTransfer;
      }
    } else if (txData.payload.Move.type === "script_payload") {
      txInsights.supraCoinChangeAmount = this.getSupraCoinChangeAmount(
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
   * @param transactionHash Transaction hash for getting transaction details
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

    if (
      resData.data == null ||
      resData.data.status === TransactionStatus.Pending
    ) {
      return null;
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
      txConfirmationTime: Math.floor(
        resData.data.block_header.timestamp.microseconds_since_unix_epoch /
          1000000
      ),
      status:
        resData.data.status == "Unexecuted"
          ? "Pending"
          : resData.data.status == "Fail"
          ? "Failed"
          : resData.data.status,
      events: resData.data.output?.Move.events,
      blockNumber: resData.data.block_header.height,
      blockHash: resData.data.block_header.hash,
      transactionInsights: this.getTransactionInsights(
        account.toString(),
        resData.data
      ),
    };
  }

  /**
   * Get transaction associated with an account
   * @param account Supra account address
   * @param count Number of transactions details
   * @param fromTx Transaction hash from which transactions details have to be retrieved
   * @returns Transaction Details
   */
  async getAccountTransactionsDetail(
    account: HexString,
    count: number = 15,
    fromTx = "0000000000000000000000000000000000000000000000000000000000000000"
  ): Promise<TransactionDetail[]> {
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/accounts/${account.toString()}/transactions?count=${count}&last_seen=${fromTx}`
    );
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
        txConfirmationTime: Math.floor(
          data.block_header.timestamp.microseconds_since_unix_epoch / 1000000
        ),
        status:
          data.status == "Unexecuted"
            ? "Pending"
            : data.status == "Fail"
            ? "Failed"
            : data.status,
        events: data.output.Move.events,
        blockNumber: data.block_header.height,
        blockHash: data.block_header.hash,
        transactionInsights: this.getTransactionInsights(
          account.toString(),
          data
        ),
      });
    });
    return accountTransactionsDetail;
  }

  /**
   * Get Coin Transfer related transactions details
   * @param account Supra account address
   * @param count Number of transactions details
   * @param start Epoch timestamp based on which transactions details have to be retrieved
   * @returns Transaction Details
   */
  async getCoinTransactionsDetail(
    account: HexString,
    count: number = 15,
    start: number = 0
  ): Promise<TransactionDetail[]> {
    let resData = await this.sendRequest(
      true,
      `/rpc/v1/accounts/${account.toString()}/coin_transactions?count=${count}&start=${start}`
    );
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
        txConfirmationTime: Math.floor(
          data.block_header.timestamp.microseconds_since_unix_epoch / 1000000
        ),
        status:
          data.status == "Unexecuted"
            ? "Pending"
            : data.status == "Fail"
            ? "Failed"
            : data.status,
        events: data.output.Move.events,
        blockNumber: data.block_header.height,
        blockHash: data.block_header.hash,
        transactionInsights: this.getTransactionInsights(
          account.toShortString(),
          data
        ),
      });
    });
    return coinTransactionsDetail;
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

  private async waitForTransactionCompletion(
    txHash: string
  ): Promise<TransactionStatus> {
    for (let i = 0; i < this.maxRetryForTransactionCompletion; i++) {
      let txStatus = await this.getTransactionStatus(txHash);
      if (txStatus === null || txStatus == TransactionStatus.Pending) {
        await sleep(this.delayBetweenPoolingRequest);
      } else {
        return txStatus;
      }
    }
    return TransactionStatus.Pending;
  }

  private async sendTx(
    sendTxJsonPayload: SendTxPayload
  ): Promise<TransactionResponse> {
    let resData = await this.sendRequest(
      false,
      "/rpc/v1/transactions/submit",
      sendTxJsonPayload
    );
    console.log("Transaction Request Sent, Waiting For Completion");

    return {
      txHash: resData.data,
      result: await this.waitForTransactionCompletion(resData.data),
    };
  }

  private async getSendTxPayload(
    senderAccount: AptosAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ): Promise<SendTxPayload> {
    console.log("Sequence Number: ", rawTxn.sequence_number);

    let txPayload = (
      rawTxn.payload as TxnBuilderTypes.TransactionPayloadEntryFunction
    ).value;

    return {
      Move: {
        raw_txn: {
          sender: senderAccount.address().toString(),
          sequence_number: Number(rawTxn.sequence_number),
          payload: {
            EntryFunction: {
              module: {
                address: txPayload.module_name.address.toHexString().toString(),
                name: txPayload.module_name.name.value,
              },
              function: txPayload.function_name.value,
              ty_args: [],
              args: fromUint8ArrayToJSArray(txPayload.args),
            },
          },
          max_gas_amount: Number(rawTxn.max_gas_amount),
          gas_unit_price: Number(rawTxn.gas_unit_price),
          expiration_timestamp_secs: Number(rawTxn.expiration_timestamp_secs),
          chain_id: rawTxn.chain_id.value,
        },
        authenticator: {
          Ed25519: {
            public_key: senderAccount.pubKey().toString(),
            signature: senderAccount
              .signBuffer(TransactionBuilder.getSigningMessage(rawTxn))
              .toString(),
          },
        },
      },
    };
  }

  private async getTxObject(
    senderAddr: HexString,
    moduleAddr: string,
    moduleName: string,
    functionName: string,
    functionTypeArgs: [],
    functionArgs: Uint8Array[],
    maxGas: bigint = BigInt(2000)
  ): Promise<TxnBuilderTypes.RawTransaction> {
    return new TxnBuilderTypes.RawTransaction(
      new TxnBuilderTypes.AccountAddress(senderAddr.toUint8Array()),
      (await this.getAccountInfo(senderAddr)).sequence_number,
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
      maxGas, // Setting MaxGasAmount As 2000 Because In Devnet Only Those Transactions Will Be Executing Using This Method Whose Gas Consumption Will Always Less Than 2000
      // await this.getGasPrice(),
      BigInt(100),
      BigInt(999999999999999),
      this.chainId
    );
  }

  /**
   * Transfer supra coin
   * @param senderAccount Sender KeyPair
   * @param receiverAccountAddr Receiver Supra Account address
   * @param amount Amount to transfer
   * @returns Transaction Response
   */
  async transferSupraCoin(
    senderAccount: AptosAccount,
    receiverAccountAddr: HexString,
    amount: bigint
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
      await this.getTxObject(
        senderAccount.address(),
        "0000000000000000000000000000000000000000000000000000000000000001",
        "aptos_account",
        "transfer",
        [],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)],
        maxGas
      )
    );
    await this.simulateTx(sendTxPayload);
    return await this.sendTx(sendTxPayload);
  }

  /**
   * Publish package or module on supra network
   * @param senderAccount Module Publisher KeyPair
   * @param packageMetadata Package Metadata
   * @param modulesCode module code
   * @returns Transaction Response
   */
  async publishPackage(
    senderAccount: AptosAccount,
    packageMetadata: Uint8Array,
    modulesCode: Uint8Array[]
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
      await this.getTxObject(
        senderAccount.address(),
        "0000000000000000000000000000000000000000000000000000000000000001",
        "code",
        "publish_package_txn",
        [],
        [BCS.bcsSerializeBytes(packageMetadata), codeSerializer.getBytes()]
      )
    );
    await this.simulateTx(sendTxPayload);
    return await this.sendTx(sendTxPayload);
  }

  /**
   * Simulate a transaction using the provided transaction payload
   * @param sendTxPayload Transaction payload
   */
  async simulateTx(sendTxPayload: SendTxPayload): Promise<void> {
    let resData = await this.sendRequest(
      false,
      "/rpc/v1/transactions/simulate",
      sendTxPayload
    );

    if (resData.data.estimated_status.split(" ")[1] !== "EXECUTED") {
      throw new Error(
        "Transaction Can Be Failed, Reason: " + resData.data.estimated_status
      );
    }
    console.log("Transaction Simulation Done");
    return;
  }
}
