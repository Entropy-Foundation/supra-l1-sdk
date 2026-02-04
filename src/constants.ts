export const DEFAULT_CHAIN_ID = 6;
export const MAX_RETRY_FOR_TRANSACTION_COMPLETION = 300;
export const DELAY_BETWEEN_POOLING_REQUEST = 1000; // 1 Second
export const DEFAULT_RECORDS_ITEMS_COUNT = 15;
// The `maximum_number_of_gas_units` amount at move layer is 2 million
export const DEFAULT_MAX_GAS_UNITS = BigInt(500000);
// The `min_price_per_gas_unit` amount at move layer is 100_000
export const DEFAULT_GAS_PRICE = BigInt(100_000);
export const DEFAULT_TX_EXPIRATION_DURATION = 300; // 5 Minutes
export const MILLISECONDS_PER_SECOND = 1000;
export const SUPRA_FRAMEWORK_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
export const SUPRA_COIN_TYPE = "0x1::supra_coin::SupraCoin";
export const DEFAULT_ENABLE_SIMULATION = false;
export const DEFAULT_WAIT_FOR_TX_COMPLETION = false;
export const DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_EXISTS = 10;
export const DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_NOT_EXISTS = 1020;
export const RAW_TRANSACTION_SALT = "SUPRA::RawTransaction";
export const RAW_TRANSACTION_WITH_DATA_SALT = "SUPRA::RawTransactionWithData";
export const X_SUPRA_CURSOR = "x-supra-cursor";
