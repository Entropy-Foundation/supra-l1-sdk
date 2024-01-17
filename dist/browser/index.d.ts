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
declare class SupraClient {
    supraNodeURL: string;
    chainId: TxnBuilderTypes.ChainId;
    requestTimeout: number;
    maxRetryForTransactionCompletion: number;
    delayBetweenPoolingRequest: number;
    constructor(url: string, chainId?: TxnBuilderTypes.ChainId);
    static init(url: string): Promise<SupraClient>;
    getChainId(): Promise<TxnBuilderTypes.ChainId>;
    getGasPrice(): Promise<bigint>;
    fundAccountWithFaucet(account: HexString): Promise<string[]>;
    getAccountSequenceNumber(account: HexString): Promise<bigint>;
    getTransactionDetail(transactionHash: string): Promise<TransactionDetail>;
    getSupraTransferHistory(account: HexString, count?: number, fromTx?: string): Promise<TransactionDetail[]>;
    getAccountSupraCoinBalance(account: HexString): Promise<bigint>;
    getTransactionStatus(transactionHash: string): Promise<TransactionStatus>;
    private waitForTransactionCompletion;
    private getTxObject;
    private sendTx;
    transferSupraCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint): Promise<TransactionResponse>;
    publishPackage(senderAccount: AptosAccount, packageMetadata: Uint8Array, modulesCode: Uint8Array[]): Promise<TransactionResponse>;
}

export { SupraClient };
