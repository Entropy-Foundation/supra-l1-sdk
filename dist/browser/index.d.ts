import { TxnBuilderTypes, HexString, AptosAccount } from 'aptos';

interface AccountInfo {
    sequence_number: bigint;
    authentication_key: string;
}
interface AccountResources {
    module: Array<[string, {
        address: string;
        name: string;
    }]>;
    struct_type: Array<[
        string,
        {
            address: string;
            module: string;
            name: string;
            type_args: Array<TxnBuilderTypes.StructTag>;
        }
    ]>;
}
declare enum TransactionStatus {
    Success = "Success",
    Failed = "Fail",
    Pending = "Unexecuted",
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

/**
 * Provides methods for interacting with supra rpc node.
 */
declare class SupraClient {
    supraNodeURL: string;
    chainId: TxnBuilderTypes.ChainId;
    requestTimeout: number;
    maxRetryForTransactionCompletion: number;
    delayBetweenPoolingRequest: number;
    constructor(url: string, chainId?: number);
    /**
     * Creates and initializes `SupraClient` instance
     * @param url rpc url of supra rpc node
     * @returns `SupraClient` initialized instance
     */
    static init(url: string): Promise<SupraClient>;
    private sendRequest;
    /**
     * Get Chain Id Of Supra Network
     * @returns Chain Id of network
     */
    getChainId(): Promise<TxnBuilderTypes.ChainId>;
    /**
     * Get current mean_gas_price
     * @returns Current mean_gas_price
     */
    getGasPrice(): Promise<bigint>;
    /**
     * Airdrop test Supra token on given account
     * @param account Hex-encoded 32 byte Supra account address
     * @returns Transaction hash of faucet transaction
     */
    fundAccountWithFaucet(account: HexString): Promise<string[]>;
    /**
     * Check whether given account exists onchain or not
     * @param account Hex-encoded 32 byte Supra account address
     * @returns true if account exists otherwise false
     */
    isAccountExists(account: HexString): Promise<boolean>;
    /**
     * Get info of given supra account
     * @param account Hex-encoded 32 byte Supra account address
     * @returns `AccountInfo`
     */
    getAccountInfo(account: HexString): Promise<AccountInfo>;
    /**
     * Get resources of given supra account
     * @param account Hex-encoded 32 byte Supra account address
     * @returns `AccountResources`
     */
    getAccountResources(account: HexString): Promise<AccountResources>;
    /**
     * Get given supra account's resource data
     * @param account Hex-encoded 32 byte Supra account address
     * @returns Resource data
     */
    getResourceData(account: HexString, resourceType: string): Promise<any>;
    /**
     * Get transaction details of given transaction hash
     * @param transactionHash Transaction hash for getting transaction details
     * @returns `TransactionDetail`
     */
    getTransactionDetail(transactionHash: string): Promise<TransactionDetail>;
    /**
     * Get Supra Transfer related transactions details
     * @param account Supra account address
     * @param count Number of transactions details
     * @param fromTx Transaction hash from which transactions details have to be retrieved
     * @returns Transaction Details
     */
    getSupraTransferHistory(account: HexString, count?: number, fromTx?: string): Promise<TransactionDetail[]>;
    /**
     * Get Supra balance of given account
     * @param account Supra Account address for getting balance
     * @returns Supra Balance
     */
    getAccountSupraCoinBalance(account: HexString): Promise<bigint>;
    private waitForTransactionCompletion;
    private sendTx;
    private getSendTxPayload;
    private getTxObject;
    /**
     * Transfer supra coin
     * @param senderAccount Sender KeyPair
     * @param receiverAccountAddr Receiver Supra Account address
     * @param amount Amount to transfer
     * @returns Transaction Response
     */
    transferSupraCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint): Promise<TransactionResponse>;
    /**
     * Publish package or module on supra network
     * @param senderAccount Module Publisher KeyPair
     * @param packageMetadata Package Metadata
     * @param modulesCode module code
     * @returns Transaction Response
     */
    publishPackage(senderAccount: AptosAccount, packageMetadata: Uint8Array, modulesCode: Uint8Array[]): Promise<TransactionResponse>;
    /**
     * Simulate a transaction using the provided transaction payload
     * @param sendTxPayload Transaction payload
     */
    simulateTx(sendTxPayload: SendTxPayload): Promise<void>;
}

export { SupraClient };
