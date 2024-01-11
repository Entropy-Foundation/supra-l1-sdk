import * as aptos from "aptos";
import * as supraSDK from "./index";

(async () => {
  let supraClient = await supraSDK.SupraClient.init(
    "https://rpc-devnet.supraoracles.com/rpc/v1"
  );

  let senderAccount = new aptos.AptosAccount(
    Buffer.from(
      "69BAD1485DA7BE75B244B12DB72C0402FF456BD443E42AD240B756BAE19968EF",
      "hex"
    )
  );
  console.log("Sender", senderAccount.address());
  console.log(
    "Funding Sender With Faucet: ",
    await supraClient.fundAccountWithFaucet(senderAccount.address())
  );

  /// Random Receiver
  // let receiverAccount = new aptos.AptosAccount();
  // console.log("Receiver", receiverAccount.address());
  let tempReceiver = new aptos.HexString(
    "0x668d1a46c8b111cd8dc9cf92c5bda1356537349bf4f7d4c579bdd829a2054a30"
  );
  console.log("Receiver", tempReceiver);

  console.log(
    "Sender Balance Before TX: ",
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  );
  console.log(
    "Transfer Account TxHash: ",
    await supraClient.transferSupraCoin(
      senderAccount,
      // receiverAccount.address().toString(),
      tempReceiver,
      BigInt(10000)
    )
  );
  console.log(
    "Sender Balance After TX: ",
    await supraClient.getAccountSupraCoinBalance(senderAccount.address())
  );
  console.log(
    "Receiver Balance After TX: ",
    await supraClient.getAccountSupraCoinBalance(
      // receiverAccount.address().toString()
      tempReceiver
    )
  );

  // To Get Detail Of Transactions Related To SupraCoin Transfer And Which Are Associated With Defined Account
  console.log(
    "Sender Supra Transfer History: ",
    await supraClient.getSupraTransferHistory(
      senderAccount.address()
      // 5
    )
  );

  //// To Get Hashes Of Transactions Associated With Defined Account
  // console.log(
  //   "Sender Transactions Hashes: ",
  //   await supraClient.getAccountTransactionHashes(senderAccount.address())
  // );

  //// To Get Transaction's Detail Using Transaction Hash
  // console.log(
  //   "Transaction Detail: ",
  //   await supraClient.getTransactionDetail(
  //     "e2d823912292724da53d694362b452d70bb7d526030e7fdd9d5e7e423894c7a2"
  //   )
  // );
})();
