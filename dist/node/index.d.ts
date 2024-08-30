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
interface CoinInfo {
    name: string;
    symbol: string;
    decimals: number;
}
declare enum TransactionStatus {
    Success = "Success",
    Failed = "Failed",
    Pending = "Pending"
}
interface TransactionResponse {
    txHash: string;
    result: TransactionStatus;
}
declare enum TxTypeForTransactionInsights {
    CoinTransfer = "CoinTransfer",
    EntryFunctionCall = "EntryFunctionCall",
    ScriptCall = "ScriptCall"
}
interface CoinChange {
    coinType: string;
    amount: bigint;
}
interface TransactionInsights {
    coinReceiver: string;
    coinChange: Array<CoinChange>;
    type: TxTypeForTransactionInsights;
}
interface TransactionDetail {
    txHash: string;
    sender: string;
    sequenceNumber: number;
    maxGasAmount: number;
    gasUnitPrice: number;
    gasUsed: number;
    transactionCost: number;
    txConfirmationTime: number;
    status: TransactionStatus;
    events: any;
    blockNumber: number;
    blockHash: string;
    transactionInsights: TransactionInsights;
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
                    ty_args: Array<FunctionTypeArgs>;
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
interface FunctionTypeArgs {
    struct: {
        address: string;
        module: string;
        name: string;
        type_args: Array<any>;
    };
}
interface FaucetRequestResponse {
    status: TransactionStatus;
    transactionHash: string;
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
    fundAccountWithFaucet(account: HexString): Promise<FaucetRequestResponse>;
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
     * Get list of all resources held by given supra account
     * @param account Hex-encoded 32 byte Supra account address
     * @returns `AccountResources`
     */
    getAccountResources(account: HexString): Promise<AccountResources>;
    /**
     * Get data of resource held by given supra account
     * @param account Hex-encoded 32 byte Supra account address
     * @param resourceType Type of a resource
     * @returns Resource data
     */
    getResourceData(account: HexString, resourceType: string): Promise<any>;
    /**
     * Get status of given supra transaction
     * @param transactionHash Hex-encoded 32 byte transaction hash for getting transaction status
     * @returns TransactionStatus
     */
    getTransactionStatus(transactionHash: string): Promise<TransactionStatus | null>;
    private getCoinChangeAmount;
    private getTransactionInsights;
    /**
     * Get transaction details of given transaction hash
     * @param account Hex-encoded 32 byte Supra account address
     * @param transactionHash Hex-encoded 32 byte transaction hash for getting transaction details
     * @returns `TransactionDetail`
     */
    getTransactionDetail(account: HexString, transactionHash: string): Promise<TransactionDetail | null>;
    /**
     * Get transaction associated with an account
     * @param account Supra account address
     * @param count Number of transactions details
     * @param fromTx Transaction hash from which transactions details have to be retrieved
     * @returns Transaction Details
     */
    getAccountTransactionsDetail(account: HexString, count?: number, fromTx?: string): Promise<TransactionDetail[]>;
    /**
     * Get Coin Transfer related transactions details
     * @param account Supra account address
     * @param count Number of transactions details
     * @param start Epoch timestamp based on which transactions details have to be retrieved
     * @returns Transaction Details
     */
    getCoinTransactionsDetail(account: HexString, count?: number, start?: number): Promise<TransactionDetail[]>;
    getAccountCompleteTransactionsDetail(account: HexString, count?: number): Promise<TransactionDetail[]>;
    /**
     * Get Supra balance of given account
     * @param coinType Type of a coin resource
     * @returns CoinInfo
     */
    getCoinInfo(coinType: string): Promise<CoinInfo>;
    /**
     * Get Supra balance of given account
     * @param account Supra Account address for getting balance
     * @returns Supra Balance
     */
    getAccountSupraCoinBalance(account: HexString): Promise<bigint>;
    /**
     * Get Coin balance of given account
     * @param account Supra account address for getting balance
     * @param coinType Type of a coin resource
     * @returns Supra Balance
     */
    getAccountCoinBalance(account: HexString, coinType: string): Promise<bigint>;
    private waitForTransactionCompletion;
    private sendTx;
    private getSendTxPayload;
    sendTxUsingSerializedRawTransaction(senderAccount: AptosAccount, serializedRawTransaction: Uint8Array): Promise<TransactionResponse>;
    static createRawTxObject(senderAddr: HexString, senderSequenceNumber: bigint, moduleAddr: string, moduleName: string, functionName: string, functionTypeArgs: TxnBuilderTypes.TypeTag[], functionArgs: Uint8Array[], chainId: TxnBuilderTypes.ChainId, maxGas?: bigint, gasUnitPrice?: bigint, txExpiryTime?: bigint): Promise<TxnBuilderTypes.RawTransaction>;
    static createSerializedRawTxObject(senderAddr: HexString, senderSequenceNumber: bigint, moduleAddr: string, moduleName: string, functionName: string, functionTypeArgs: TxnBuilderTypes.TypeTag[], functionArgs: Uint8Array[], chainId: TxnBuilderTypes.ChainId, maxGas?: bigint, gasUnitPrice?: bigint, txExpiryTime?: bigint): Promise<Uint8Array>;
    /**
     * Transfer supra coin
     * @param senderAccount Sender KeyPair
     * @param receiverAccountAddr Receiver Supra Account address
     * @param amount Amount to transfer
     * @returns Transaction Response
     */
    transferSupraCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint): Promise<TransactionResponse>;
    /**
     * Transfer coin
     * @param senderAccount Sender KeyPair
     * @param receiverAccountAddr Receiver Supra Account address
     * @param amount Amount to transfer
     * @param coinType Type of coin
     * @returns Transaction Response
     */
    transferCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint, coinType: string): Promise<TransactionResponse>;
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

export { type AccountInfo, type AccountResources, type CoinChange, type CoinInfo, type FaucetRequestResponse, type FunctionTypeArgs, type SendTxPayload, SupraClient, type TransactionDetail, type TransactionInsights, type TransactionResponse, TransactionStatus, TxTypeForTransactionInsights };
