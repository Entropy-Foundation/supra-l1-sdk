import { TxnBuilderTypes, HexString, AptosAccount } from 'aptos';
import { AxiosResponse } from 'axios';

declare enum TransactionStatus {
    Pending = "Pending",
    Unexecuted = "Unexecuted",
    Success = "Success",
    Failed = "Fail",
    Invalid = "Invalid"
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

declare class SupraClient {
    supraNodeURL: string;
    chainId: TxnBuilderTypes.ChainId;
    requestTimeout: number;
    maxRetryForTransactionCompletion: number;
    delayBetweenPoolingRequest: number;
    constructor(url: string, chainId?: number);
    static init(url: string): Promise<SupraClient>;
    sendRequest(isGetMethod: boolean, subURL: string, data?: any): Promise<AxiosResponse<any, any>>;
    getChainId(): Promise<TxnBuilderTypes.ChainId>;
    getGasPrice(): Promise<bigint>;
    fundAccountWithFaucet(account: HexString): Promise<string[]>;
    isAccountExists(account: HexString): Promise<boolean>;
    getAccountSequenceNumber(account: HexString): Promise<bigint>;
    getTransactionDetail(transactionHash: string): Promise<TransactionDetail>;
    getSupraTransferHistory(account: HexString, count?: number, fromTx?: string): Promise<TransactionDetail[]>;
    getAccountSupraCoinBalance(account: HexString): Promise<bigint>;
    getTransactionStatus(transactionHash: string): Promise<TransactionStatus>;
    private waitForTransactionCompletion;
    private sendTx;
    private getSendTxPayload;
    private getTxObject;
    transferSupraCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint): Promise<TransactionResponse>;
    publishPackage(senderAccount: AptosAccount, packageMetadata: Uint8Array, modulesCode: Uint8Array[]): Promise<TransactionResponse>;
    simulateTx(sendTxPayload: SendTxPayload): Promise<void>;
}

export { SupraClient };
