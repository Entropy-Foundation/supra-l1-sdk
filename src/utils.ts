import { TxnBuilderTypes } from "legacy-aptos-sdk";
import { FunctionTypeArgs } from "./types";

export const parseFunctionTypeArgs = (
  functionTypeArgs: TxnBuilderTypes.TypeTag[]
): Array<FunctionTypeArgs> => {
  let functionTypeArgsParsed: Array<FunctionTypeArgs> = new Array();
  functionTypeArgs.forEach((data) => {
    let structTagData = (data as TxnBuilderTypes.TypeTagStruct).value;
    functionTypeArgsParsed.push({
      struct: {
        address: structTagData.address.toHexString().toString(),
        module: structTagData.module_name.value,
        name: structTagData.name.value,
        type_args: parseFunctionTypeArgs(structTagData.type_args),
      },
    });
  });
  return functionTypeArgsParsed;
};

export const fromUint8ArrayToJSArray = (
  arr: Uint8Array[]
): Array<Array<number>> => {
  let resData: Array<Array<number>> = new Array();
  for (let i = 0; i < arr.length; i++) {
    resData.push(Array.from(arr[i]));
  }
  return resData;
};

export const normalizeAddress = (addressToNormalize: string): string => {
  if (addressToNormalize.length != 66) {
    if (addressToNormalize.slice(0, 2) === "0x") {
      addressToNormalize = addressToNormalize.slice(2).padStart(64, "0");
    } else {
      addressToNormalize = addressToNormalize.padStart(64, "0");
    }
  }
  return addressToNormalize;
};

export const sleep = (timeMs: number): Promise<null> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};
