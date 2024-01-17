import * as aptos from "aptos";
import * as supraSDK from "./index";

(async () => {
  let supraClient = new supraSDK.SupraClient(
    "https://rpc-devnet.supraoracles.com/rpc/v1/"
  );

  let senderAccount = new aptos.AptosAccount(
    Buffer.from(
      "69BAD1485DA7BE75B244B12DB72C0402FF456BD443E42AD240B756BAE19968EF",
      "hex"
    )
  );
  console.log("Sender", senderAccount.address());
  // console.log(
  //   "Funding Sender With Faucet: ",
  //   await supraClient.fundAccountWithFaucet(senderAccount.address())
  // );

  let receiverAddress = new aptos.HexString(
    "0x668d1a46c8b111cd8dc9cf92c5bda1356537349bf4f7d4c579bdd829a2054a30"
  );
  console.log("Receiver", receiverAddress);

  console.log(
    "Sender Balance Before TX: ",
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  );
  // console.log(
  //   "Receiver Balance Before TX: ",
  //   await supraClient.getAccountSupraCoinBalance(receiverAddress)
  // );
  let txResData = await supraClient.transferSupraCoin(
    senderAccount,
    receiverAddress,
    BigInt(10000)
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

  // console.log(
  //   "Transaction Detail: ",
  //   (await supraClient.getTransactionDetail("a3547cfee53d83cb79b3d003c5dd98968ef380d6647422efa376118af9b3c145")));
})();
