export const DEFAULT_CHAIN_ID = 6;
export const MAX_RETRY_FOR_TRANSACTION_COMPLETION = 300;
export const DELAY_BETWEEN_POOLING_REQUEST = 1000; // 1 Second
export const DEFAULT_RECORDS_ITEMS_COUNT = 15;
// The `maximum_number_of_gas_units` amount at move layer is 2 million
export const DEFAULT_MAX_GAS_UNITS = BigInt(500000);
// The `min_price_per_gas_unit` amount at move layer is 100
// Note: Currently our network does not prioritizes tx based our gas price,
// Hence If any tx is sent with more gas price than 100 it will be treated same as tx with 100 gas price
export const DEFAULT_GAS_PRICE = BigInt(100);
export const DEFAULT_TX_EXPIRATION_DURATION = 300; // 5 Minutes
export const MILLISECONDS_PER_SECOND = 1000;
export const SUPRA_FRAMEWORK_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
export const DEFAULT_ENABLE_SIMULATION = false;
export const DEFAULT_WAIT_FOR_TX_COMPLETION = false;
export const DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_EXISTS = 10;
export const DEFAULT_MAX_GAS_FOR_SUPRA_TRANSFER_WHEN_RECEIVER_NOT_EXISTS = 1020;
export const RAW_TRANSACTION_SALT = "SUPRA::RawTransaction";
export const RAW_TRANSACTION_WITH_DATA_SALT = "SUPRA::RawTransactionWithData";