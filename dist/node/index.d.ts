import { TxnBuilderTypes, HexString, AptosAccount } from 'aptos';
export { BCS, HexString, AptosAccount as SupraAccount, TxnBuilderTypes } from 'aptos';

interface AccountInfo {
    sequence_number: bigint;
    authentication_key: string;
}
type AccountResources = Array<Array<[
    string,
    {
        address: string;
        module: string;
        name: string;
        type_args: Array<TxnBuilderTypes.StructTag>;
    }
]>>;
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
    gasUsed: number | undefined;
    transactionCost: number | undefined;
    txExpirationTimestamp: number | undefined;
    txConfirmationTime: number | undefined;
    status: TransactionStatus;
    events: any;
    blockNumber: number | undefined;
    blockHash: string | undefined;
    transactionInsights: TransactionInsights;
    vm_status: string | undefined;
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
interface EnableTransactionWaitAndSimulationArgs {
    enableWaitForTransaction?: boolean;
    enableTransactionSimulation?: boolean;
}
interface OptionalTransactionPayloadArgs {
    maxGas?: bigint;
    gasUnitPrice?: bigint;
    txExpiryTime?: bigint;
}
interface OptionalTransactionArgs {
    optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs;
    enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs;
}

/**
 * Provides methods for interacting with supra rpc node.
 */
declare class SupraClient {
    supraNodeURL: string;
    chainId: TxnBuilderTypes.ChainId;
    constructor(url: string, chainId?: number);
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
    static init(url: string): Promise<SupraClient>;
    private sendRequest;
    /**
     * Get Chain Id Of Supra Network
     * @returns Chain Id of network
     */
    getChainId(): Promise<TxnBuilderTypes.ChainId>;
    /**
     * Get current `mean_gas_price`
     * @returns Current `mean_gas_price`
     */
    getGasPrice(): Promise<bigint>;
    /**
     * Airdrop test Supra token on given account
     * @param account Hex-encoded 32 byte Supra account address
     * @returns `FaucetRequestResponse`
     */
    fundAccountWithFaucet(account: HexString): Promise<FaucetRequestResponse>;
    /**
     * Check whether given account exists onchain or not
     * @param account Hex-encoded 32 byte Supra account address
     * @returns `true` if account exists otherwise `false`
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
     * @example
     * ```typescript
     * let supraCoinInfo = await supraClient.getResourceData(
     *   new HexString("0x1"),
     *   "0x1::coin::CoinInfo<0x1::supra_coin::SupraCoin>"
     * )
     * ```
     */
    getResourceData(account: HexString, resourceType: string): Promise<any>;
    /**
     * Get status of given supra transaction
     * @param transactionHash Hex-encoded 32 byte transaction hash for getting transaction status
     * @returns `TransactionStatus`
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
     * Get transactions sent by the account
     * @param account Supra account address
     * @param count Number of transactions details
     * @param start Cursor for pagination based response
     * @returns List of `TransactionDetail`
     */
    getAccountTransactionsDetail(account: HexString, count?: number, start?: number | null): Promise<TransactionDetail[]>;
    /**
     * Get Coin Transfer related transactions associated with the account
     * @param account Supra account address
     * @param count Number of transactions details
     * @param start Cursor for pagination based response
     * @returns List of `TransactionDetail`
     */
    getCoinTransactionsDetail(account: HexString, count?: number, start?: number | null): Promise<TransactionDetail[]>;
    /**
     * Get transactions sent by the account and Coin transfer related transactions
     * @param account Supra account address
     * @param count Number of coin transfer transactions and account sent transaction to be considered,
     * For instance if the value is `N` so total `N*2` transactions will be returned.
     * @returns List of `TransactionDetail`
     */
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
    /**
     * Generate `ed25519_signature` for supra transaction using `RawTransaction`
     * @param senderAccount Sender KeyPair
     * @param rawTxn Raw transaction data
     * @returns ed25519 signature in `HexString`
     */
    static signSupraTransaction(senderAccount: AptosAccount, rawTxn: TxnBuilderTypes.RawTransaction): HexString;
    private getRawTxDataInJson;
    /**
     * Generate `SendTxPayload` using `RawTransaction` to send transaction request
     * Generated data can be used to send transaction directly using `/rpc/v1/transactions/submit` endpoint of `rpc_node`
     * @param senderAccount Sender KeyPair
     * @param rawTxn Raw transaction data
     * @returns `SendTxPayload`
     */
    getSendTxPayload(senderAccount: AptosAccount, rawTxn: TxnBuilderTypes.RawTransaction): SendTxPayload;
    /**
     * Send `entry_function_payload` type tx using serialized raw transaction data
     * @param senderAccount Sender KeyPair
     * @param serializedRawTransaction Serialized raw transaction data
     * @param enableTransactionWaitAndSimulationArgs enable transaction wait and simulation arguments
     * @returns `TransactionResponse`
     */
    sendTxUsingSerializedRawTransaction(senderAccount: AptosAccount, serializedRawTransaction: Uint8Array, enableTransactionWaitAndSimulationArgs?: EnableTransactionWaitAndSimulationArgs): Promise<TransactionResponse>;
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
     * @returns Serialized raw transaction object
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
    createRawTxObject(senderAddr: HexString, senderSequenceNumber: bigint, moduleAddr: string, moduleName: string, functionName: string, functionTypeArgs: TxnBuilderTypes.TypeTag[], functionArgs: Uint8Array[], optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs): Promise<TxnBuilderTypes.RawTransaction>;
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
    createSerializedRawTxObject(senderAddr: HexString, senderSequenceNumber: bigint, moduleAddr: string, moduleName: string, functionName: string, functionTypeArgs: TxnBuilderTypes.TypeTag[], functionArgs: Uint8Array[], optionalTransactionPayloadArgs?: OptionalTransactionPayloadArgs): Promise<Uint8Array>;
    /**
     * Create signed transaction payload
     * @param senderAccount Sender KeyPair
     * @param rawTxn Raw transaction payload
     * @returns `SignedTransaction`
     */
    static createSignedTransaction(senderAccount: AptosAccount, rawTxn: TxnBuilderTypes.RawTransaction): TxnBuilderTypes.SignedTransaction;
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
    static deriveTransactionHash(signedTransaction: TxnBuilderTypes.SignedTransaction): string;
    /**
     * Transfer supra coin
     * @param senderAccount Sender KeyPair
     * @param receiverAccountAddr Receiver Supra Account address
     * @param amount Amount to transfer
     * @param optionalTransactionArgs optional arguments for transaction
     * @returns `TransactionResponse`
     */
    transferSupraCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint, optionalTransactionArgs?: OptionalTransactionArgs): Promise<TransactionResponse>;
    /**
     * Transfer custom type of coin
     * @param senderAccount Sender KeyPair
     * @param receiverAccountAddr Receiver Supra Account address
     * @param amount Amount to transfer
     * @param coinType Type of custom coin
     * @param optionalTransactionArgs optional arguments for transaction
     * @returns `TransactionResponse`
     */
    transferCoin(senderAccount: AptosAccount, receiverAccountAddr: HexString, amount: bigint, coinType: string, optionalTransactionArgs?: OptionalTransactionArgs): Promise<TransactionResponse>;
    /**
     * Publish package or module on supra network
     * @param senderAccount Module Publisher KeyPair
     * @param packageMetadata Package Metadata
     * @param modulesCode module code
     * @param optionalTransactionArgs optional arguments for transaction
     * @returns `TransactionResponse`
     */
    publishPackage(senderAccount: AptosAccount, packageMetadata: Uint8Array, modulesCode: Uint8Array[], optionalTransactionArgs?: OptionalTransactionArgs): Promise<TransactionResponse>;
    /**
     * Simulate a transaction using the provided transaction payload
     * @param sendTxPayload Transaction payload
     * @returns Transaction simulation result
     */
    simulateTx(sendTxPayload: SendTxPayload): Promise<any>;
    /**
     * Simulate a transaction using the provided Serialized raw transaction data
     * @param senderAccountAddress Tx sender account address
     * @param senderAccountPubKey Tx sender account public key
     * @param serializedRawTransaction Serialized raw transaction data
     * @returns Transaction simulation result
     */
    simulateTxUsingSerializedRawTransaction(senderAccountAddress: HexString, senderAccountPubKey: HexString, serializedRawTransaction: Uint8Array): Promise<any>;
}

export { type AccountInfo, type AccountResources, type CoinChange, type CoinInfo, type EnableTransactionWaitAndSimulationArgs, type FaucetRequestResponse, type FunctionTypeArgs, type OptionalTransactionArgs, type OptionalTransactionPayloadArgs, type SendTxPayload, SupraClient, type TransactionDetail, type TransactionInsights, type TransactionResponse, TransactionStatus, TxTypeForTransactionInsights };
