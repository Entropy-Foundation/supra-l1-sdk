import * as aptos from "aptos";
import * as supraSDK from "./index";

(async () => {
  // let supraClient = new supraSDK.SupraClient(
  // "https://rpc-devnet.supraoracles.com/rpc/v1/"
  // );

  let supraClient = await supraSDK.SupraClient.init(
    "https://rpc-wallet.supra.com/rpc/v1/"
  );

  let senderAccount = new aptos.AptosAccount(
    Buffer.from(
      // "69BAD1485DA7BE75B244B12DB72C0402FF456BD443E42AD240B756BAE19968EF",
      "86f982c4a4277cc6b41f649743c6cf07f94d3b39c2f355c064e17a0975f1de1e",
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
    // "9589339bde41fc2bdd9c37292e12420e24b4c25c4f6e61bac6ae99b87ccce2f3"
    "86f982c4a4277cc6b41f649743c6cf07f94d3b39c2f355c064e17a0975f1de1e"
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

  // // To Get Detail Of Transactions Related To SupraCoin Transfer And Which Are Associated With Defined Account
  // console.log(
  //   "Sender Supra Transfer History: ",
  //   await supraClient.getSupraTransferHistory(senderAccount.address(), 5)
  // );
})();
