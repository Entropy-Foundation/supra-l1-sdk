import { TxnBuilderTypes, HexString, AptosAccount } from 'aptos';

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
        payload: any;
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
declare class SupraClient {
    supraNodeURL: string;
    chainId: TxnBuilderTypes.ChainId;
    requestTimeout: number;
    maxRetryForTransactionCompletion: number;
    delayBetweenPoolingRequest: number;
    private constructor();
    static init(url: string): Promise<SupraClient>;
    getChainId(): Promise<TxnBuilderTypes.ChainId>;
    getGasPrice(): Promise<bigint>;
    fundAccountWithFaucet(account: HexString): Promise<string[]>;
    getAccountSequenceNumber(account: HexString): Promise<bigint>;
    getAccountTransactionHashes(account: HexString): Promise<string[]>;
    getTransactionDetail(transactionHash: string): Promise<TransactionDetail>;
    getSupraTransferHistory(account: HexString, count?: number, fromTx?: string): Promise<SupraTransferHistoryResponse[]>;
    getAccountSupraCoinBalance(account: HexString): Promise<bigint>;
    getTransactionStatus(transactionHash: string): Promise<TransactionStatus>;
    private waitForTransactionCompletion;
    private getTxObject;
    private sendTx;
    transferSupraCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint): Promise<TransactionResponse>;
    publishPackage(senderAccount: AptosAccount, packageMetadata: Uint8Array, modulesCode: Uint8Array[]): Promise<TransactionResponse>;
}

export { SupraClient };
