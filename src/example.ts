import {
  HexString,
  SupraAccount,
  SupraClient,
  BCS,
  TxnBuilderTypes,
  MILLISECONDS_PER_SECOND,
} from "./index";

// Run with `npm run example`. The example sends transactions, so the sender account must hold
// funds on the target network.
//
// Environment:
//   SUPRA_PRIVATE_KEY              Hex-encoded 32 byte Ed25519 private key of the sender account
//                                  (required).
//   SUPRA_RPC_URL                  RPC node URL (default: https://rpc-devnet.supra.com).
//   SUPRA_EXAMPLE_WRAPPER_MODULE   Address of a deployed module with a `wrapper::two_signers` entry
//                                  function; the multi-agent step is skipped when unset.
//   SUPRA_EXAMPLE_MULTISIG_ACCOUNT Address of a multisig account owned by the sender that needs a
//                                  single approval; the multisig steps are skipped when unset.

const DEFAULT_RPC_URL = "https://rpc-devnet.supra.com";

(async () => {
  const privateKeyHex = process.env.SUPRA_PRIVATE_KEY;
  if (!privateKeyHex) {
    console.error(
      "SUPRA_PRIVATE_KEY is not set. Set it to the hex-encoded private key of an account that " +
        "holds funds on the target network and run `npm run example` again."
    );
    process.exit(1);
  }
  const rpcUrl = process.env.SUPRA_RPC_URL || DEFAULT_RPC_URL;

  // To Create Instance Of Supra Client.
  // Note: A chain id can be passed to the constructor (`new SupraClient(url, chainId)`), the
  // default is `DEFAULT_CHAIN_ID`, which is 6.
  //
  // `SupraClient.init` does not need a chain id: it is fetched from the node when the instance
  // is created.
  let supraClient = await SupraClient.init(rpcUrl);

  let senderAccount = new SupraAccount(
    Uint8Array.from(Buffer.from(privateKeyHex.replace(/^0x/, ""), "hex"))
  );
  console.log("Sender Address: ", senderAccount.address());

  // To Check Whether Account Exists
  if ((await supraClient.isAccountExists(senderAccount.address())) == false) {
    console.log(
      "Funding Sender With Faucet: ",
      // To Fund Account With Test Supra Tokens
      await supraClient.fundAccountWithFaucet(senderAccount.address())
    );
  }

  // The receiver is generated at run time, so it has no account on the network yet.
  let receiverAddress = new SupraAccount().address();
  console.log("Receiver: ", receiverAddress);

  console.log(
    "Receiver Account Exists: ",
    await supraClient.isAccountExists(receiverAddress)
  );

  console.log(
    "Sender Balance Before TX: ",
    // To Get User Account Balance
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  );
  if ((await supraClient.isAccountExists(receiverAddress)) == true) {
    console.log(
      "Receiver Balance Before TX: ",
      await supraClient.getAccountSupraCoinBalance(receiverAddress)
    );
  }

  // To Transfer Supra Coin From Sender To Receiver
  let txResData = await supraClient.transferSupraCoin(
    senderAccount,
    receiverAddress,
    BigInt(1000),
    {
      enableTransactionWaitAndSimulationArgs: {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true,
      },
    }
  );
  console.log("Transfer SupraCoin TxRes: ", txResData);

  // To Get Transaction's Detail Using Transaction Hash
  console.log(
    "Transaction Detail: ",
    await supraClient.getTransactionDetail(
      senderAccount.address(),
      txResData.txHash
    )
  );

  let coinType =
    "0x0000000000000000000000000000000000000000000000000000000000000001::supra_coin::SupraCoin";
  // To Fetch coin info
  console.log("Coin Info", await supraClient.getCoinInfo(coinType));

  // To get account coin balance
  console.log(
    "Sender Coin Balance Before Tx: ",
    await supraClient.getAccountCoinBalance(senderAccount.address(), coinType)
  );

  // To transfer coin
  let supraCoinTransferResData = await supraClient.transferCoin(
    senderAccount,
    receiverAddress,
    BigInt(1000),
    coinType,
    {
      enableTransactionWaitAndSimulationArgs: {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true,
      },
    }
  );
  console.log(supraCoinTransferResData);

  console.log(
    "Sender Coin Balance After Tx: ",
    await supraClient.getAccountCoinBalance(senderAccount.address(), coinType)
  );

  console.log(
    "Sender Balance After TX: ",
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  );
  console.log(
    "Receiver Balance After TX: ",
    await supraClient.getAccountSupraCoinBalance(receiverAddress)
  );

  let txData = await supraClient.getTransactionDetail(
    senderAccount.address(),
    supraCoinTransferResData.txHash
  );
  if (txData != null) {
    console.log("Transaction Detail: ", txData.transactionInsights);
  }

  // To Get Detail Of Transactions Which Are Sent By Defined Account
  console.log(
    "Sender Account Transactions: ",
    await supraClient.getAccountTransactionsDetail(senderAccount.address())
  );

  // To Get Detail Of Transactions Which Are Associated With Defined Account In Coin Change
  console.log(
    "Sender Coin Transactions: ",
    await supraClient.getCoinTransactionsDetail(senderAccount.address())
  );

  // To Get Combined Results Of 'getAccountTransactionsDetail' and 'getCoinTransactionsDetail'
  console.log(
    await supraClient.getAccountCompleteTransactionsDetail(
      new HexString(senderAccount.address().toString())
    )
  );

  // To create a serialized raw transaction
  let supraCoinTransferSerializedRawTransaction =
    await supraClient.createSerializedRawTxObject(
      senderAccount.address(),
      (
        await supraClient.getAccountInfo(senderAccount.address())
      ).sequence_number,
      "0000000000000000000000000000000000000000000000000000000000000001",
      "supra_account",
      "transfer",
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(1000)]
    );

  // To simulate transaction using serialized raw transaction data
  console.log(
    await supraClient.simulateTxUsingSerializedRawTransaction(
      {
        Ed25519: {
          public_key: senderAccount.pubKey().toString(),
          signature: "0x" + "0".repeat(128),
        },
      },
      supraCoinTransferSerializedRawTransaction
    )
  );

  // To send serialized transaction
  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferSerializedRawTransaction,
      {
        enableTransactionSimulation: true,
        enableWaitForTransaction: true,
      }
    )
  );

  // To create a raw transaction
  // Note: Process to create a `rawTx` and `serializedRawTx` is almost similar
  let supraCoinTransferRawTransaction = await supraClient.createRawTxObject(
    senderAccount.address(),
    (
      await supraClient.getAccountInfo(senderAccount.address())
    ).sequence_number,
    "0000000000000000000000000000000000000000000000000000000000000001",
    "supra_account",
    "transfer",
    [],
    [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(10000)]
  );

  // To create signed transaction
  let supraCoinTransferSignedTransaction = SupraClient.createSignedTransaction(
    senderAccount,
    supraCoinTransferRawTransaction
  );

  // To create transaction hash locally
  console.log(
    SupraClient.deriveTransactionHash(supraCoinTransferSignedTransaction)
  );

  // Generating serialized `rawTx` using `rawTx` Object
  // and sending transaction using generated serialized `rawTx`
  let supraCoinTransferRawTransactionSerializer = new BCS.Serializer();
  supraCoinTransferRawTransaction.serialize(
    supraCoinTransferRawTransactionSerializer
  );
  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferRawTransactionSerializer.getBytes(),
      {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true,
      }
    )
  );

  // Complete Sponsor transaction flow

  // Transaction sponsor keyPair
  let feePayerAccount = new SupraAccount();
  console.log("FeePayer Address: ", feePayerAccount.address());

  if ((await supraClient.isAccountExists(feePayerAccount.address())) == false) {
    console.log(
      "Funding FeePayer Account With Faucet: ",
      await supraClient.fundAccountWithFaucet(feePayerAccount.address())
    );
  }

  // Creating RawTransaction for sponsor transaction
  let sponsorTxSupraCoinTransferRawTransaction =
    await supraClient.createRawTxObject(
      senderAccount.address(),
      (
        await supraClient.getAccountInfo(senderAccount.address())
      ).sequence_number,
      "0000000000000000000000000000000000000000000000000000000000000001",
      "supra_account",
      "transfer",
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(10000)]
    );

  // Creating Sponsor Transaction Payload
  let sponsorTransactionPayload = new TxnBuilderTypes.FeePayerRawTransaction(
    sponsorTxSupraCoinTransferRawTransaction,
    [],
    new TxnBuilderTypes.AccountAddress(feePayerAccount.address().toUint8Array())
  );

  // Generating sender authenticator
  let sponsorTxSenderAuthenticator = SupraClient.signSupraMultiTransaction(
    senderAccount,
    sponsorTransactionPayload
  );
  // Generating sponsor authenticator
  let feePayerAuthenticator = SupraClient.signSupraMultiTransaction(
    feePayerAccount,
    sponsorTransactionPayload
  );

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
        enableTransactionSimulation: true,
      }
    )
  );

  // Complete Multi-Agent transaction flow
  const wrapperModuleAddress = process.env.SUPRA_EXAMPLE_WRAPPER_MODULE;
  if (wrapperModuleAddress) {
  // Secondary signer1 keyPair
  let secondarySigner1 = new SupraAccount();
  console.log("Secondary Signer1 Address: ", secondarySigner1.address());

  if (
    (await supraClient.isAccountExists(secondarySigner1.address())) == false
  ) {
    console.log(
      "Funding Secondary Signer1 Account With Faucet: ",
      await supraClient.fundAccountWithFaucet(secondarySigner1.address())
    );
  }

  // Creating RawTransaction for multi-agent RawTransaction
  // Note: The module at `SUPRA_EXAMPLE_WRAPPER_MODULE` must contain `wrapper::two_signers`.
  let multiAgentRawTransaction = await supraClient.createRawTxObject(
    senderAccount.address(),
    (
      await supraClient.getAccountInfo(senderAccount.address())
    ).sequence_number,
    wrapperModuleAddress,
    "wrapper",
    "two_signers",
    [],
    []
  );

  // Creating Multi-Agent Transaction Payload
  let multiAgentTransactionPayload =
    new TxnBuilderTypes.MultiAgentRawTransaction(multiAgentRawTransaction, [
      new TxnBuilderTypes.AccountAddress(
        secondarySigner1.address().toUint8Array()
      ),
    ]);

  // Generating sender authenticator
  let multiAgentSenderAuthenticator = SupraClient.signSupraMultiTransaction(
    senderAccount,
    multiAgentTransactionPayload
  );
  // Generating Secondary Signer1 authenticator
  let secondarySigner1Authenticator = SupraClient.signSupraMultiTransaction(
    secondarySigner1,
    multiAgentTransactionPayload
  );

  // Sending Multi-Agent transaction
  console.log(
    await supraClient.sendMultiAgentTransaction(
      [secondarySigner1.address().toString()],
      multiAgentRawTransaction,
      multiAgentSenderAuthenticator,
      [secondarySigner1Authenticator],
      {
        enableWaitForTransaction: true,
        enableTransactionSimulation: true,
      }
    )
  );
  } else {
    console.log(
      "Skipping the multi-agent transaction: SUPRA_EXAMPLE_WRAPPER_MODULE is not set."
    );
  }

  let ledgerWalletSenderAccountPubkey = new TxnBuilderTypes.Ed25519PublicKey(
    Uint8Array.from(
      Buffer.from(
        "c127c6b1955dd5cb815cd44372aac92811430fa805e473935cd3a147c90b4cee",
        "hex"
      )
    )
  );
  let signature = new HexString(
    "82000c4f40aa4cbd35b26b4b56ea073e9a33cfd32040eab0834577bf7451808eaa79a304f5cf99a1e5ea9660f190fef69de8f200e432c612a7e895e5528c770e"
  );
  let serializedRawTransaction = Uint8Array.from(
    Buffer.from(
      "4451aa86090708900650da5fdb8d7530f1d90dee338448c0223e728378f182c1030000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a73757072615f636f696e095375707261436f696e000220b8922417130785087f9c7926e76542531b703693fdc74c9386b65cf4427f4e8008e80300000000000020a10700000000006400000000000000919f56670000000006",
      "hex"
    )
  );

  // // This will fail due to change in simulate api response, the issue is raised and once that
  // /// get fixed uncomment this code.
  // try {
  //   // As we had created this tx payload during testing,
  //   // hence its expected to be failed with 'TRANSACTION_EXPIRED'
  //   await supraClient.sendTxUsingSerializedRawTransactionAndSignature(
  //     HexString.fromUint8Array(ledgerWalletSenderAccountPubkey.toBytes()),
  //     signature,
  //     serializedRawTransaction,
  //     {
  //       enableTransactionSimulation: true,
  //       enableWaitForTransaction: true,
  //     }
  //   );
  // } catch (err) {
  //   if (!(err as Error).message.includes("TRANSACTION_EXPIRED")) {
  //     throw new Error(
  //       `Something went wrong tx must fail with 'TRANSACTION_EXPIRED', err: ${err}`
  //     );
  //   }
  // }

  // To Send Automation Transaction
  let supraCoinTransferAutomationSerializedRawTransaction =
    supraClient.createSerializedAutomationRegistrationTxPayloadRawTxObject(
      senderAccount.address(),
      (await supraClient.getAccountInfo(senderAccount.address()))
        .sequence_number,
      "0000000000000000000000000000000000000000000000000000000000000001",
      "supra_account",
      "transfer",
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(1000)],
      BigInt(500),
      // The gas price cap must not be below the node's minimum gas price.
      await supraClient.getMinGasUnitPrice(),
      BigInt(1000000000),
      BigInt(Math.floor(Date.now() / MILLISECONDS_PER_SECOND) + 2 * 60 * 60),
      []
    );

  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferAutomationSerializedRawTransaction,
      {
        enableTransactionSimulation: true,
        enableWaitForTransaction: true,
      }
    )
  );

  // To Execute Multisig transaction
  // Creating multisig transaction
  const multisigAccountEnv = process.env.SUPRA_EXAMPLE_MULTISIG_ACCOUNT;
  if (multisigAccountEnv) {
  let multisigAccountAddress = new HexString(multisigAccountEnv);
  let supraCoinTransferCreateTxRawTransaction =
    await supraClient.createSerializedRawTxObjectToCreateMultisigTx(
      senderAccount.address(),
      (
        await supraClient.getAccountInfo(senderAccount.address())
      ).sequence_number,
      multisigAccountAddress,
      "0000000000000000000000000000000000000000000000000000000000000001",
      "supra_account",
      "transfer",
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(1000)]
    );
  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferCreateTxRawTransaction,
      {
        enableTransactionSimulation: true,
        enableWaitForTransaction: true,
      }
    )
  );

  // Executing multisig transaction.
  // Note: The used multisig account only require single approval which is provided at the time of
  // tx creation hence no need of approval.
  let supraCoinTransferMultisigRawTransaction =
    supraClient.createSerializedMultisigPayloadRawTxObject(
      senderAccount.address(),
      (await supraClient.getAccountInfo(senderAccount.address()))
        .sequence_number,
      multisigAccountAddress,
      "0000000000000000000000000000000000000000000000000000000000000001",
      "supra_account",
      "transfer",
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(1000)]
    );
  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferMultisigRawTransaction,
      {
        enableTransactionSimulation: false,
        enableWaitForTransaction: true,
      }
    )
  );
  } else {
    console.log(
      "Skipping the multisig transactions: SUPRA_EXAMPLE_MULTISIG_ACCOUNT is not set."
    );
  }

  // To execute move-script
  let moveScriptCodeHex =
    "a11ceb0b060000000501000403040a050e0f071d29084620000000010002020300010304010002060c030001060c010503060c0503067369676e65720d73757072615f6163636f756e740a616464726573735f6f66087472616e736665720000000000000000000000000000000000000000000000000000000000000001000001060a000b0011000b01110102";

  let supraCoinTransferScriptRawTransaction =
    supraClient.createSerializedScriptTxPayloadRawTxObject(
      senderAccount.address(),
      (await supraClient.getAccountInfo(senderAccount.address()))
        .sequence_number,
      Uint8Array.from(Buffer.from(moveScriptCodeHex, "hex")),
      [],
      [new TxnBuilderTypes.TransactionArgumentU64(BigInt(1000))]
    );

  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferScriptRawTransaction,
      {
        enableTransactionSimulation: true,
        enableWaitForTransaction: true,
      }
    )
  );
})();
