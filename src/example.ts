import * as aptos from "aptos";
import * as supraSDK from "./index";
import fs from "fs";

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
  let tempReceiver =
    new aptos.HexString("0x668d1a46c8b111cd8dc9cf92c5bda1356537349bf4f7d4c579bdd829a2054a30");
  console.log("Receiver", tempReceiver);

  console.log(
    "Sender Balance Before TX: ",
    await supraClient.getAccountSupraCoinBalance(
      senderAccount.address()
    )
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
    await supraClient.getAccountSupraCoinBalance(
      senderAccount.address()
    )
  );
  console.log(
    "Receiver Balance After TX: ",
    await supraClient.getAccountSupraCoinBalance(
      // receiverAccount.address().toString()
      tempReceiver
    )
  );

  // console.log(
  //   "Sender Supra Transfer History: ",
  //   await supraClient.getSupraTransferHistory(
  //     senderAccount.address()
  //   )
  // );
})();
