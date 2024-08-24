import * as aptos from "aptos";
import * as supraSDK from "./index";

(async () => {
  // // To Create Instance Of Supra Client.
  // // Note: Here We Need To Pass ChainId, Default ChainId Value Is 3
  // let supraClient = new supraSDK.SupraClient(
  //   "https://rpc-wallet.supra.com/",
  //   3
  // );

  // To Create Instance Of Supra Client, But In This Method We Don't Need To Pass ChainId.
  // ChainId Will Be Identified At Instance Creation Time By Making RPC Call.
  let supraClient = await supraSDK.SupraClient.init(
    // "https://rpc-wallet.supra.com/"
    // "https://rpc-devnet.supra.com/"
    // "http://localhost:27000/"
    // "https://rpc-qanet.supra.com/"
    "https://rpc-staging.supra.com/"
  );

  let senderAccount = new aptos.AptosAccount(
    Buffer.from(
      "2b9654793a999d1d487dabbd1b8f194156e15281fa1952af121cc97b27578d88",
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

  let receiverAddress = new aptos.HexString(
    "1000000000000000000000000000000000000000000000000000000000000000"
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
    BigInt(1000)
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
    "0xf339b447d975572db8b48f4ad54b47f51d8ace193803e30e2e5a6b10e93e2fa2::coin::USDC";
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
      BigInt(1000000),
      coinType
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
    new aptos.HexString(
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
    await supraClient.getAccountTransactionsDetail(senderAccount.address(), 5)
  );

  // To Get Detail Of Transactions Which Are Associated With Defined Account In Coin Change
  console.log(
    "Sender Coin Transactions: ",
    await supraClient.getCoinTransactionsDetail(senderAccount.address())
  );

  // To Get Combined Results Of 'getAccountTransactionsDetail' and 'getCoinTransactionsDetail'
  console.log(
    await supraClient.getAccountCompleteTransactionsDetail(
      new aptos.HexString(
        "4f88ad501b780c12290a6fa63e1e1500eaa5fd5ba945896ce77ee8c53a2f6d00"
      )
    )
  );
})();
