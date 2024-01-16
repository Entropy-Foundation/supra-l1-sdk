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

interface SupraTransferHistoryResponse {
  recipient: string;
  amount: number;
  txn_hash: string;
  raw: {
    sender: string;
    sequence_number: number;
    max_gas_amount: number;
    gas_unit_price: number;
    expiration_timestamp_secs: number;
    payload: any; // We will be not requiring payload because module and function is deterministic and we are getting args in API response
  };
}

interface TransactionDetail {
  sender: string;
  receiver: string;
  amount: number;
  gasUnitPrice: number;
  gasUsed: number;
  transactionCost: number;
  status: TransactionStatus;
}

export class SupraClient {
  supraNodeURL: string;
  chainId: TxnBuilderTypes.ChainId;
  requestTimeout = 10000; // 10 Seconds
  maxRetryForTransactionCompletion = 20;
  delayBetweenPoolingRequest = 1000; // 1 Second

  constructor(
    url: string,
    chainId: TxnBuilderTypes.ChainId = new TxnBuilderTypes.ChainId(Number(4))
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
    return resData.data.transactions;
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
    return {
      sender: resData.data.sender,
      receiver: resData.data.receiver,
      amount: resData.data.amount,
      gasUnitPrice: 100, // Currently The Gas Unit Price Is 100
      gasUsed: resData.data.gas_used,
      transactionCost: 100 * resData.data.gas_used,
      status: resData.data.status,
    };
  }

  async getSupraTransferHistory(
    account: HexString,
    count: number = 15,
    fromTx = "0000000000000000000000000000000000000000000000000000000000000000"
  ): Promise<SupraTransferHistoryResponse[]> {
    let resData = await axios({
      method: "get",
      baseURL: this.supraNodeURL,
      url: `/accounts/${account.toString()}/transactions?count=${count}&last_seen=${fromTx}`,
      timeout: this.requestTimeout,
    });
    if (resData.data.record == null) {
      throw new Error("Account Not Exists, Or Invalid Account Is Passed");
    }
    return resData.data.record;
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
      BigInt(500000),
      // await this.getGasPrice(),
      BigInt(100),
      BigInt(4000000 * 10000),
      this.chainId
    );
  }

  private async sendTx(
    senderAccount: AptosAccount,
    rawTxn: TxnBuilderTypes.RawTransaction
  ): Promise<TransactionResponse> {
    console.log("Sequence Number: ", rawTxn.sequence_number);
    let txPayload = (
      rawTxn.payload as TxnBuilderTypes.TransactionPayloadEntryFunction
    ).value;
    let resData = await axios({
      method: "post",
      baseURL: this.supraNodeURL,
      url: "/transactions/submit",
      data: {
        Move: {
          raw_txn: {
            sender: senderAccount.address().toString(),
            sequence_number: Number(rawTxn.sequence_number),
            payload: {
              EntryFunction: {
                module: {
                  address: txPayload.module_name.address
                    .toHexString()
                    .toString(),
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
      },
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

  async transferSupraCoin(
    senderAccount: AptosAccount,
    receiverAccountAddr: HexString,
    amount: bigint
  ): Promise<TransactionResponse> {
    return await this.sendTx(
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
    return await this.sendTx(
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
  }
}
