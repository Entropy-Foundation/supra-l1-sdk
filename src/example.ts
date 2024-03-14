import * as aptos from "aptos";
import * as supraSDK from "./index";

(async () => {
  // // To Create Instance Of Supra Client.
  // // Note: Here We Need To Pass ChainId, Default ChainId Value Is 3
  // let supraClient = new supraSDK.SupraClient(
  //   "https://rpc-wallet.supra.com/rpc/v1/",
  //   3
  // );

  // To Create Instance Of Supra Client, But In This Method We Don't Need To Pass ChainId.
  // ChainId Will Be Identified At Instance Creation Time By Making RPC Call.
  let supraClient = await supraSDK.SupraClient.init(
    // "https://rpc-wallet.supra.com/rpc/v1/"
    "https://rpc-devnet.supraoracles.com/",
  );

  let senderAccount = new aptos.AptosAccount(
    Buffer.from(
      "86f982c4a4277cc6b41f649743c6cf07f94d3b39c2f355c064e17a0975f1de28",
      "hex"
    )
  );
  console.log("Sender", senderAccount.address());

  // To Check Whether Account Exists
  if ((await supraClient.isAccountExists(senderAccount.address())) == false) {
    console.log(
      "Funding Sender With Faucet: ",
      // To Fund Account With Test Supra Tokens
      await supraClient.fundAccountWithFaucet(senderAccount.address())
    );
  }

  let receiverAddress = new aptos.HexString(
    "9589339bde41fc2bdd9c37292e12420e24b4c25c4f6e61bac6ae99b87ccce2f2"
  );
  console.log("Receiver", receiverAddress);

  console.log(
    "Receiver Account Exists: ",
    await supraClient.isAccountExists(receiverAddress)
  );
  // Restructuring

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
    await supraClient.getTransactionDetail(txResData.txHash)
  );

  console.log(
    "Sender Balance After TX: ",
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  );
  console.log(
    "Receiver Balance After TX: ",
    await supraClient.getAccountSupraCoinBalance(receiverAddress)
  );

  // To Get Detail Of Transactions Related To SupraCoin Transfer And Which Are Associated With Defined Account
  console.log(
    "Sender Supra Transfer History: ",
    await supraClient.getSupraTransferHistory(senderAccount.address(), 5)
  );
})();
