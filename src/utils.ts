import { FunctionTypeArgs } from "./types";

export const parseFunctionTypeArgs = (
  functionTypeArgs: string[]
): Array<FunctionTypeArgs> => {
  let functionTypeArgsParsed: Array<FunctionTypeArgs> = new Array();
  functionTypeArgs.forEach((data) => {
    let parsedData = data.split("::");
    functionTypeArgsParsed.push({
      struct: {
        address: parsedData[0],
        module: parsedData[1],
        name: parsedData[2],
        type_args: [],
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
  if (
    addressToNormalize.length > 64 &&
    addressToNormalize.slice(0, 2) === "0x"
  ) {
    addressToNormalize = addressToNormalize.slice(2);
  }
  if (addressToNormalize.length != 64) {
    throw new Error("address length must be 64 or it's size must be 256 bits");
  }
  return addressToNormalize;
};

export const sleep = (timeMs: number): Promise<null> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};
