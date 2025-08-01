import { TxnBuilderTypes } from "supra-l1-sdk-core";
import { FunctionTypeArgs, ScriptArgumentJson } from "./types";

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

export const parseScriptArgs = (
  scriptArgs: TxnBuilderTypes.TransactionArgument[]
): Array<ScriptArgumentJson> => {
  let parsedArgs: Array<ScriptArgumentJson> = new Array();
  scriptArgs.forEach((arg) => {
    if (arg instanceof TxnBuilderTypes.TransactionArgumentU8) {
      parsedArgs.push({ U8: arg.value });
    } else if (arg instanceof TxnBuilderTypes.TransactionArgumentU32) {
      parsedArgs.push({ U32: arg.value });
    } else if (arg instanceof TxnBuilderTypes.TransactionArgumentU64) {
      parsedArgs.push({ U64: Number(arg.value) });
    } else if (arg instanceof TxnBuilderTypes.TransactionArgumentU128) {
      parsedArgs.push({ U128: Number(arg.value) });
    } else if (arg instanceof TxnBuilderTypes.TransactionArgumentU256) {
      parsedArgs.push({ U256: Number(arg.value) });
    } else if (arg instanceof TxnBuilderTypes.TransactionArgumentAddress) {
      parsedArgs.push({ Address: arg.value.toHexString().toString() });
    } else if (arg instanceof TxnBuilderTypes.TransactionArgumentU8Vector) {
      parsedArgs.push({ U8Vector: Array.from(arg.value) });
    } else if (arg instanceof TxnBuilderTypes.TransactionArgumentBool) {
      parsedArgs.push({ Bool: arg.value });
    } else {
      throw new Error("Invalid script argument variant");
    }
  });
  return parsedArgs;
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
  let normalized = addressToNormalize.toLowerCase();

  if (normalized.length < 66) {
    if (normalized.startsWith("0x")) {
      normalized = normalized.slice(2).padStart(64, "0");
    } else {
      normalized = normalized.padStart(64, "0");
    }
    return "0x" + normalized;
  }

  if (normalized.length === 66 && normalized.startsWith("0x")) {
    return normalized;
  }

  throw new Error(
    "Invalid address. With '0x', address length should be exactly 66 characters."
  );
};

export const sleep = (timeMs: number): Promise<null> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};
