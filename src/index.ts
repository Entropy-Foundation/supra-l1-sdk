import {
  TxnBuilderTypes,
  BCS,
  HexString,
  AptosAccount,
  TransactionBuilder,
} from "aptos";
import axios from "axios";
import { normalizeAddress, fromUint8ArrayToJSArray, sleep } from "./utils";

enum TransactionStatus {
  Pending = "Pending",
  Unexecuted = "Unexecuted",
  Success = "Success",
  Failed = "Fail",
  Invalid = "Invalid",
}

interface TransactionResponse {
  txHash: string;
  result: TransactionStatus;
}

interface TransactionDetail {
  txHash: string;
  sender: string;
  receiver: string;
  amount: number;
  sequenceNumber: number;
  maxGasAmount: number;
  gasUnitPrice: number;
  gasUsed: number;
  transactionCost: number;
  txConfirmationTime: number;
  status: TransactionStatus;
  action: string;
  events: any;
  blockNumber: number;
  blockHash: string;
}

interface SendTxPayload {
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
          ty_args: Array<any>;
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

export class SupraClient {
  supraNodeURL: string;
  chainId: TxnBuilderTypes.ChainId;
  requestTimeout = 10000; // 10 Seconds
  maxRetryForTransactionCompletion = 20;
  delayBetweenPoolingRequest = 1000; // 1 Second

  constructor(
    url: string,
    chainId: TxnBuilderTypes.ChainId = new TxnBuilderTypes.ChainId(Number(3))
  ) {
    this.supraNodeURL = url;
    this.chainId = chainId;
  }

  static async init(url: string): Promise<SupraClient> {
    let supraClient = new SupraClient(url);
    supraClient.chainId = await supraClient.getChainId();
    return supraClient;
  }

  async getChainId(): Promise<TxnBuilderTypes.ChainId> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: "/transactions/chain_id",
      timeout: this.requestTimeout,
    });
    return new TxnBuilderTypes.ChainId(Number(resData.data.id));
  }

  async getGasPrice(): Promise<bigint> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: "/transactions/estimate_gas_price",
      timeout: this.requestTimeout,
    });
    return BigInt(resData.data.mean_gas_price);
  }

  async fundAccountWithFaucet(account: HexString): Promise<string[]> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/wallet/airdrop/${account.toString()}`,
      timeout: this.requestTimeout,
    });
    await this.waitForTransactionCompletion(resData.data.transactions[1]);
    return resData.data.transactions;
  }

  async isAccountExists(account: HexString): Promise<boolean> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/accounts/${account.toString()}`,
      timeout: this.requestTimeout,
    });
    if (resData.data.account == null) {
      return false;
    }
    return true;
  }

  async getAccountSequenceNumber(account: HexString): Promise<bigint> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/accounts/${account.toString()}`,
      timeout: this.requestTimeout,
    });
    if (resData.data.account == null) {
      throw new Error("Account Not Exists, Or Invalid Account Is Passed");
    }
    return BigInt(resData.data.account.sequence_number);
  }

  async getTransactionDetail(
    transactionHash: string
  ): Promise<TransactionDetail> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/transactions/${transactionHash}`,
      timeout: this.requestTimeout,
    });
    if (resData.data.transaction == null) {
      throw new Error(
        "Transaction Not Found, May Be Transaction Hash Is Invalid"
      );
    }
    return {
      txHash: transactionHash,
      sender: resData.data.sender,
      receiver: resData.data.receiver,
      amount: resData.data.amount,
      sequenceNumber: resData.data.sequence_number,
      maxGasAmount: resData.data.max_gas_amount,
      gasUnitPrice: resData.data.gas_unit_price,
      gasUsed: resData.data.gas_used,
      transactionCost: resData.data.gas_unit_price * resData.data.gas_used,
      txConfirmationTime: resData.data.confirmation_time,
      status: resData.data.status,
      action: resData.data.action,
      events: resData.data.events,
      blockNumber: resData.data.block_number,
      blockHash: resData.data.block_hash,
    };
  }

  async getSupraTransferHistory(
    account: HexString,
    count: number = 15,
    fromTx = "0000000000000000000000000000000000000000000000000000000000000000"
  ): Promise<TransactionDetail[]> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/accounts/${account.toString()}/transactions?count=${count}&last_seen=${fromTx}`,
      timeout: this.requestTimeout,
    });
    if (resData.data.record == null) {
      throw new Error("Account Not Exists, Or Invalid Account Is Passed");
    }
    let supraCoinTransferHistory: TransactionDetail[] = [];
    resData.data.record.forEach((data: any) => {
      supraCoinTransferHistory.push({
        txHash: data.txn_hash,
        sender: data.sender,
        receiver: data.receiver,
        amount: data.amount,
        sequenceNumber: data.sequence_number,
        maxGasAmount: data.max_gas_amount,
        gasUnitPrice: data.gas_unit_price,
        gasUsed: data.gas_used,
        transactionCost: data.gas_unit_price * data.gas_used,
        txConfirmationTime: data.confirmation_time,
        status: data.status,
        action: data.action,
        events: data.events,
        blockNumber: data.block_number,
        blockHash: data.block_hash,
      });
    });
    return supraCoinTransferHistory;
  }

  async getAccountSupraCoinBalance(account: HexString): Promise<bigint> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/accounts/${account.toString()}/coin`,
      timeout: this.requestTimeout,
    });
    if (resData.data.coins == null) {
      throw new Error("Account Not Exists, Or Invalid Account Is Passed");
    }
    return BigInt(resData.data.coins.coin);
  }

  async getTransactionStatus(
    transactionHash: string
  ): Promise<TransactionStatus> {
    if (transactionHash.length != 64) {
      throw new Error(
        "transactionHash length must be 64 or it's size must be 256 bits"
      );
    }
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/transactions/${transactionHash}/status`,
      timeout: this.requestTimeout,
    });
    return resData.data.status;
  }

  private async waitForTransactionCompletion(
    txHash: string
  ): Promise<TransactionStatus> {
    for (let i = 0; i < this.maxRetryForTransactionCompletion; i++) {
      let txStatus = await this.getTransactionStatus(txHash);
      if (
        txStatus != TransactionStatus.Pending &&
        txStatus != TransactionStatus.Unexecuted
      ) {
        // Due to lake of proper data synchronization we gets old state of chain,
        // and if in case we just execute one transaction after completion of another transaction
        // that just goes in pending state for long time and after some time that gets fail.
        // To Resolve This Issue We Are Just Adding Wait Or Sleep After Receiving Transaction Status.
        await sleep(5000);
        return txStatus;
      }
      await sleep(this.delayBetweenPoolingRequest);
    }
    return TransactionStatus.Pending;
  }

  private async sendTx(
    sendTxJsonPayload: SendTxPayload
  ): Promise<TransactionResponse> {
    let resData = await axios({
      method: "post",
      baseURL: this.supraNodeURL,
      url: "/transactions/submit",
      data: sendTxJsonPayload,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.requestTimeout,
    });
    return {
      txHash: resData.data.txn_hash,
      result: await this.waitForTransactionCompletion(resData.data.txn_hash),
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
    functionArgs: Uint8Array[]
  ): Promise<TxnBuilderTypes.RawTransaction> {
    return new TxnBuilderTypes.RawTransaction(
      new TxnBuilderTypes.AccountAddress(senderAddr.toUint8Array()),
      await this.getAccountSequenceNumber(senderAddr),
      // BigInt(0),
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
      BigInt(2000), // Setting MaxGasAmount As 2000 Because In Devnet Only Those Transactions Will Be Executing Using This Method Whose Gas Consumption Will Always Less Than 2000
      // await this.getGasPrice(),
      BigInt(100),
      BigInt(999999999999999),
      this.chainId
    );
  }

  async transferSupraCoin(
    senderAccount: AptosAccount,
    receiverAccountAddr: HexString,
    amount: bigint
  ): Promise<TransactionResponse> {
    let sendTxPayload = await this.getSendTxPayload(
      senderAccount,
      await this.getTxObject(
        senderAccount.address(),
        "0000000000000000000000000000000000000000000000000000000000000001",
        "aptos_account",
        "transfer",
        [],
        [receiverAccountAddr.toUint8Array(), BCS.bcsSerializeUint64(amount)]
      )
    );
    await this.simulateTx(sendTxPayload);
    return await this.sendTx(sendTxPayload);
  }

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

  async simulateTx(sendTxPayload: SendTxPayload): Promise<void> {
    let resData = await axios({
      method: "post",
      baseURL: this.supraNodeURL,
      url: "/transactions/simulate",
      data: sendTxPayload,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.requestTimeout,
    });
    console.log(resData.data);
    if (resData.data.estimated_status.split(" ")[1] !== "EXECUTED") {
      throw new Error(
        "Transaction Can Be Failed, Reason: " + resData.data.estimated_status
      );
    }
    return;
  }
}
