import {
  HexString,
  SupraAccount,
  SupraClient,
  BCS,
  TxnBuilderTypes,
  ILogTransport
} from '../dist/cjs/index'

import { Logger } from './logger'

// LogTransport for extensive logging
const logTransport: ILogTransport = (log) => {
  console.log(
    `[${new Date(log.timestamp).toISOString()}] ${log.level}: ${log.message}`
  )
  if (log.data) {
    console.log('Data:', JSON.stringify(log.data, null, 2))
  }
}

// Creating logger with logtransport
// set to 'DEBUG' for verbose logging output from the SDK
const logger = new Logger('INFO', logTransport)

// To run this example, install `ts-node` (e.g. `npm install -g ts-node`), enter the directory
// that contains this file and run `ts-node ./example.ts`.
;(async () => {
  // // To Create Instance Of Supra Client.
  // // Note: Here We Need To Pass ChainId, Default ChainId Value Is 6
  // let supraClient = new supraSDK.SupraClient({
  //   url: "https://rpc-testnet.supra.com/",
  //   chainId: 6
  // });

  // To Create Instance Of Supra Client, But In This Method We Don't Need To Pass ChainId.
  // ChainId Will Be Identified At Instance Creation Time By Making RPC Call.
  let supraClient = await SupraClient.init({
    url: 'https://rpc-testnet.supra.com/',
    logger
  })

  let senderAccount = new SupraAccount(
    Buffer.from(
      '2b9654793a999d1d487dabbd1b8f194156e15281fa1952af121cc97b27578d89',
      'hex'
    )
  )
  console.log('Sender Address: ', senderAccount.address())

  // To Check Whether Account Exists
  if ((await supraClient.accountExists(senderAccount.address())) == false) {
    console.log(
      'Funding Sender With Faucet: ',
      // To Fund Account With Test Supra Tokens
      await supraClient.fundAccountWithFaucet(senderAccount.address())
    )
  }

  let receiverAddress = new HexString(
    // "1000000000000000000000000000000000000000000000000000000000000000"
    '0xb8922417130785087f9c7926e76542531b703693fdc74c9386b65cf4427f4e80'
  )
  console.log('Receiver: ', receiverAddress)

  console.log(
    'Receiver Account Exists: ',
    await supraClient.accountExists(receiverAddress)
  )

  console.log(
    'Sender Balance Before TX: ',
    // To Get User Account Balance
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  )
  if ((await supraClient.accountExists(receiverAddress)) == true) {
    console.log(
      'Receiver Balance Before TX: ',
      await supraClient.getAccountSupraCoinBalance(receiverAddress)
    )
  }

  // To Transfer Supra Coin From Sender To Receiver
  let txResData = await supraClient.transferSupraCoin(
    senderAccount,
    receiverAddress,
    BigInt(1000),
    {
      enableTransactionWaitAndSimulationArgs: {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true
      }
    }
  )
  console.log('Transfer SupraCoin TxRes: ', txResData)

  // To Get Transaction's Detail Using Transaction Hash
  console.log(
    'Transaction Detail: ',
    await supraClient.getTransactionDetail(
      senderAccount.address(),
      txResData.txHash
    )
  )

  let coinType =
    '0x0000000000000000000000000000000000000000000000000000000000000001::supra_coin::SupraCoin'
  // To Fetch coin info
  console.log('Coin Info', await supraClient.getCoinInfo(coinType))

  // To get account coin balance
  console.log(
    'Sender Coin Balance Before Tx: ',
    await supraClient.getAccountCoinBalance(senderAccount.address(), coinType)
  )

  // To transfer coin
  let supraCoinTransferResData = await supraClient.transferCoin(
    senderAccount,
    receiverAddress,
    BigInt(1000),
    coinType,
    {
      enableTransactionWaitAndSimulationArgs: {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true
      }
    }
  )
  console.log(supraCoinTransferResData)

  console.log(
    'Sender Coin Balance After Tx: ',
    await supraClient.getAccountCoinBalance(senderAccount.address(), coinType)
  )

  console.log(
    'Sender Balance After TX: ',
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  )
  console.log(
    'Receiver Balance After TX: ',
    await supraClient.getAccountSupraCoinBalance(receiverAddress)
  )

  let txData = await supraClient.getTransactionDetail(
    senderAccount.address(),
    supraCoinTransferResData.txHash
  )
  if (txData != null) {
    console.log('Transaction Detail: ', txData.transactionInsights)
  }

  // To Get Detail Of Transactions Which Are Sent By Defined Account
  console.log(
    'Sender Account Transactions: ',
    await supraClient.getAccountTransactionsDetail(senderAccount.address())
  )

  // To Get Detail Of Transactions Which Are Associated With Defined Account In Coin Change
  console.log(
    'Sender Coin Transactions: ',
    await supraClient.getCoinTransactionsDetail(senderAccount.address())
  )

  // To Get Combined Results Of 'getAccountTransactionsDetail' and 'getCoinTransactionsDetail'
  console.log(
    await supraClient.getAccountCompleteTransactionsDetail(
      new HexString(senderAccount.address().toString())
    )
  )

  // To create a serialized raw transaction
  let supraCoinTransferSerializedRawTransaction =
    await supraClient.createSerializedRawTxObject(
      senderAccount.address(),
      (await supraClient.getAccountInfo(senderAccount.address()))
        .sequence_number,
      '0000000000000000000000000000000000000000000000000000000000000001',
      'supra_account',
      'transfer',
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(1000)]
    )

  // To simulate transaction using serialized raw transaction data
  console.log(
    await supraClient.simulateTxUsingSerializedRawTransaction(
      {
        Ed25519: {
          public_key: senderAccount.pubKey().toString(),
          signature: '0x' + '0'.repeat(128)
        }
      },
      supraCoinTransferSerializedRawTransaction
    )
  )

  // To send serialized transaction
  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferSerializedRawTransaction,
      {
        enableTransactionSimulation: true,
        enableWaitForTransaction: true
      }
    )
  )

  // To create a raw transaction
  // Note: Process to create a `rawTx` and `serializedRawTx` is almost similar
  let supraCoinTransferRawTransaction = await supraClient.createRawTxObject(
    senderAccount.address(),
    (await supraClient.getAccountInfo(senderAccount.address())).sequence_number,
    '0000000000000000000000000000000000000000000000000000000000000001',
    'supra_account',
    'transfer',
    [],
    [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(10000)]
  )

  // To create signed transaction
  let supraCoinTransferSignedTransaction = SupraClient.createSignedTransaction(
    senderAccount,
    supraCoinTransferRawTransaction
  )

  // To create transaction hash locally
  console.log(
    SupraClient.deriveTransactionHash(supraCoinTransferSignedTransaction)
  )

  // Generating serialized `rawTx` using `rawTx` Object
  // and sending transaction using generated serialized `rawTx`
  let supraCoinTransferRawTransactionSerializer = new BCS.Serializer()
  supraCoinTransferRawTransaction.serialize(
    supraCoinTransferRawTransactionSerializer
  )
  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferRawTransactionSerializer.getBytes(),
      {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true
      }
    )
  )

  // Complete Sponsor transaction flow

  // Transaction sponsor keyPair
  let feePayerAccount = new SupraAccount(
    Buffer.from(
      '2b9654793a999d1d487dabbd1b8f194156e15281fa1952af121cc97b27578d88',
      'hex'
    )
  )
  console.log('FeePayer Address: ', feePayerAccount.address())

  if ((await supraClient.accountExists(feePayerAccount.address())) == false) {
    console.log(
      'Funding FeePayer Account With Faucet: ',
      await supraClient.fundAccountWithFaucet(feePayerAccount.address())
    )
  }

  // Creating RawTransaction for sponsor transaction
  let sponsorTxSupraCoinTransferRawTransaction =
    await supraClient.createRawTxObject(
      senderAccount.address(),
      (await supraClient.getAccountInfo(senderAccount.address()))
        .sequence_number,
      '0000000000000000000000000000000000000000000000000000000000000001',
      'supra_account',
      'transfer',
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(10000)]
    )

  // Creating Sponsor Transaction Payload
  let sponsorTransactionPayload = new TxnBuilderTypes.FeePayerRawTransaction(
    sponsorTxSupraCoinTransferRawTransaction,
    [],
    new TxnBuilderTypes.AccountAddress(feePayerAccount.address().toUint8Array())
  )

  // Generating sender authenticator
  let sponsorTxSenderAuthenticator = SupraClient.signSupraMultiTransaction(
    senderAccount,
    sponsorTransactionPayload
  )
  // Generating sponsor authenticator
  let feePayerAuthenticator = SupraClient.signSupraMultiTransaction(
    feePayerAccount,
    sponsorTransactionPayload
  )

  // Sending sponsor transaction
  console.log(
    await supraClient.sendSponsorTransaction(
      feePayerAccount.address().toString(),
      [],
      sponsorTxSupraCoinTransferRawTransaction,
      sponsorTxSenderAuthenticator,
      feePayerAuthenticator,
      [],
      {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true
      }
    )
  )

  // Complete Multi-Agent transaction flow

  // Secondary signer1 keyPair
  let secondarySigner1 = new SupraAccount(
    Buffer.from(
      '2b9654793a999d1d487dabbd1b8f194156e15281fa1952af121cc97b27578d87',
      'hex'
    )
  )
  console.log('Secondary Signer1 Address: ', secondarySigner1.address())

  if ((await supraClient.accountExists(secondarySigner1.address())) == false) {
    console.log(
      'Funding Secondary Signer1 Account With Faucet: ',
      await supraClient.fundAccountWithFaucet(secondarySigner1.address())
    )
  }

  // Creating RawTransaction for multi-agent RawTransaction
  // Note: The `7452ce103328320893993cb9fc656f680a9ed28b0f429ff2ecbf6834eefab3ad::wrapper` module is deployed on testnet
  let multiAgentRawTransaction = await supraClient.createRawTxObject(
    senderAccount.address(),
    (await supraClient.getAccountInfo(senderAccount.address())).sequence_number,
    '7452ce103328320893993cb9fc656f680a9ed28b0f429ff2ecbf6834eefab3ad',
    'wrapper',
    'two_signers',
    [],
    []
  )

  // Creating Multi-Agent Transaction Payload
  let multiAgentTransactionPayload =
    new TxnBuilderTypes.MultiAgentRawTransaction(multiAgentRawTransaction, [
      new TxnBuilderTypes.AccountAddress(
        secondarySigner1.address().toUint8Array()
      )
    ])

  // Generating sender authenticator
  let multiAgentSenderAuthenticator = SupraClient.signSupraMultiTransaction(
    senderAccount,
    multiAgentTransactionPayload
  )
  // Generating Secondary Signer1 authenticator
  let secondarySigner1Authenticator = SupraClient.signSupraMultiTransaction(
    secondarySigner1,
    multiAgentTransactionPayload
  )

  // Sending Multi-Agent transaction
  console.log(
    await supraClient.sendMultiAgentTransaction(
      [secondarySigner1.address().toString()],
      multiAgentRawTransaction,
      multiAgentSenderAuthenticator,
      [secondarySigner1Authenticator],
      {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true
      }
    )
  )

  let ledgerWalletSenderAccountPubkey = new TxnBuilderTypes.Ed25519PublicKey(
    Buffer.from(
      'c127c6b1955dd5cb815cd44372aac92811430fa805e473935cd3a147c90b4cee',
      'hex'
    )
  )
  let signature = new HexString(
    '82000c4f40aa4cbd35b26b4b56ea073e9a33cfd32040eab0834577bf7451808eaa79a304f5cf99a1e5ea9660f190fef69de8f200e432c612a7e895e5528c770e'
  )
  let serializedRawTransaction = Buffer.from(
    '4451aa86090708900650da5fdb8d7530f1d90dee338448c0223e728378f182c1030000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a73757072615f636f696e095375707261436f696e000220b8922417130785087f9c7926e76542531b703693fdc74c9386b65cf4427f4e8008e80300000000000020a10700000000006400000000000000919f56670000000006',
    'hex'
  )

  try {
    // As we had created this tx payload during testing,
    // hence its expected to be failed with 'TRANSACTION_EXPIRED'
    await supraClient.sendTxUsingSerializedRawTransactionAndSignature(
      HexString.fromUint8Array(ledgerWalletSenderAccountPubkey.toBytes()),
      signature,
      serializedRawTransaction,
      {
        enableTransactionSimulation: true,
        enableWaitForTransaction: true
      }
    )
  } catch (err) {
    if (!(err as any).originalError.message.includes('TRANSACTION_EXPIRED')) {
      throw new Error(
        "Something went wrong tx must fail with 'TRANSACTION_EXPIRED'"
      )
    }
  }
})()
