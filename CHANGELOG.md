# Changelog

## 5.0.3 (YYYY-MM-DD)

### Fixed

- `isAccountExists` returns `false` when the node answers HTTP 404 for an absent account (node v12), as it already did for HTTP 400 (node v11). Other statuses and network errors are still thrown. `transferSupraCoin` uses this check when `optionalTransactionPayloadArgs` has no `maxGas`.
- `getAccountTransactionsDetail`, `getCoinTransactionsDetail` and `getAccountCompleteTransactionsDetail` skip feed items that have no `header`, such as settlement transactions (`txn_type: "settlement"`, node v12), instead of throwing.
- `getTransactionDetail` returns `null` for a transaction that has no `header`, such as a settlement transaction, instead of throwing.
- Values that are inserted into a request path (account addresses, resource types, transaction hashes, table handles) are sent as one percent-encoded path segment, so pass them unencoded: a value that is already percent-encoded is encoded again. The values `""`, `.` and `..` are rejected before any request is made. Pagination values in query strings are percent-encoded.

### Changed

- `npm test` runs offline unit tests and sends no network requests. The previous example is available as `npm run example`.
- `src/example.ts` no longer contains private keys. It reads the signing key from `SUPRA_PRIVATE_KEY` and the RPC URL from `SUPRA_RPC_URL` (default `https://rpc-devnet.supra.com`), and generates its other accounts at run time. The multi-agent and multisig steps run when `SUPRA_EXAMPLE_WRAPPER_MODULE` and `SUPRA_EXAMPLE_MULTISIG_ACCOUNT` are set. The automation registration takes its `gas_price_cap` from the node's minimum gas price.
- `ts-node`, `jest`, `ts-jest` and `@types/jest` are development dependencies.

### Security

- Any private key that was published in an earlier version of `src/example.ts` is compromised. Do not use those keys.
