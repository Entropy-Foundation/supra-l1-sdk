import { TxnBuilderTypes } from "aptos";
export interface AccountInfo {
  sequence_number: bigint;
  authentication_key: string;
}

export interface AccountResources {
  module: Array<[string, { address: string; name: string }]>;
  struct_type: Array<
    [
      string,
      {
        address: string;
        module: string;
        name: string;
        type_args: Array<TxnBuilderTypes.StructTag>;
      }
    ]
  >;
}
export enum TransactionStatus {
  Success = "Success",
  Failed = "Failed",
  Pending = "Pending",
  Invalid = "Invalid",
}

export interface TransactionResponse {
  txHash: string;
  result: TransactionStatus;
}

export interface TransactionDetail {
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

export interface SendTxPayload {
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
