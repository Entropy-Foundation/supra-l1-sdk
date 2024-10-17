import { HexString, SupraAccount, SupraClient, BCS } from "./index";

// To run this example, install `ts-node` (e.g. `npm install -g ts-node`), enter the directory
// that contains this file and run `ts-node ./example.ts`.

(async () => {
  // // To Create Instance Of Supra Client.
  // // Note: Here We Need To Pass ChainId, Default ChainId Value Is 3
  // let supraClient = new supraSDK.SupraClient(
  //   "https://rpc-wallet.supra.com/",
  //   3
  // );

  // To Create Instance Of Supra Client, But In This Method We Don't Need To Pass ChainId.
  // ChainId Will Be Identified At Instance Creation Time By Making RPC Call.
  let supraClient = await SupraClient.init(
    // "http://localhost:27001/"
    "https://rpc-testnet.supra.com/"
  );

  let senderAccount = new SupraAccount(
    Buffer.from(
      "2b9654793a999d1d487dabbd1b8f194156e15281fa1952af121cc97b27578d89",
      "hex"
    )
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

  let receiverAddress = new HexString(
    // "1000000000000000000000000000000000000000000000000000000000000000"
    "0xb8922417130785087f9c7926e76542531b703693fdc74c9386b65cf4427f4e80"
  );
  console.log("Receiver", receiverAddress);

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
    true,
    true
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
  console.log(
    await supraClient.transferCoin(
      senderAccount,
      receiverAddress,
      BigInt(1000),
      coinType,
      true,
      true
    )
  );

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
    new HexString(
      "0x4f88ad501b780c12290a6fa63e1e1500eaa5fd5ba945896ce77ee8c53a2f6d00"
    ),
    "0x338e8d8db2177c3e4ae94890dc63bdf00bd558a685b6fc42fe685a85b4bac6d9"
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
    await SupraClient.createSerializedRawTxObject(
      senderAccount.address(),
      (
        await supraClient.getAccountInfo(senderAccount.address())
      ).sequence_number,
      "0000000000000000000000000000000000000000000000000000000000000001",
      "supra_account",
      "transfer",
      [],
      [receiverAddress.toUint8Array(), BCS.bcsSerializeUint64(1000)],
      supraClient.chainId
    );

  // To simulate transaction using serialized raw transaction data
  console.log(
    await supraClient.simulateTxUsingSerializedRawTransaction(
      senderAccount.address(),
      senderAccount.pubKey(),
      supraCoinTransferSerializedRawTransaction
    )
  );

  console.log(
    await supraClient.sendTxUsingSerializedRawTransaction(
      senderAccount,
      supraCoinTransferSerializedRawTransaction,
      true,
      true
    )
  );
})();
