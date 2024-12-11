import { TxnBuilderTypes } from 'aptos'
import { FunctionTypeArgs } from '../types/types'

/**
 * Parses function type arguments into a structured format.
 * @param functionTypeArgs - Array of TypeTag objects.
 * @returns Array of FunctionTypeArgs.
 */
export const parseFunctionTypeArgs = (
  functionTypeArgs: TxnBuilderTypes.TypeTag[]
): Array<FunctionTypeArgs> => {
  let functionTypeArgsParsed: Array<FunctionTypeArgs> = new Array()
  functionTypeArgs.forEach((data) => {
    let structTagData = (data as TxnBuilderTypes.TypeTagStruct).value
    functionTypeArgsParsed.push({
      struct: {
        address: structTagData.address.toHexString().toString(),
        module: structTagData.module_name.value,
        name: structTagData.name.value,
        type_args: []
      }
    })
  })
  return functionTypeArgsParsed
}
/**
 * Converts an array of Uint8Arrays to an array of number arrays.
 * @param arr - Array of Uint8Arrays.
 * @returns Array of number arrays.
 */
export const fromUint8ArrayToJSArray = (
  arr: Uint8Array[]
): Array<Array<number>> => {
  return arr.map((item) => Array.from(item))
}

/**
 * Normalizes an address by removing the '0x' prefix and ensuring it's 64 characters long.
 * @param addressToNormalize Address string to normalize
 * @returns Normalized address string
 */
export const normalizeAddress = (addressToNormalize: string): string => {
  if (addressToNormalize.startsWith('0x')) {
    addressToNormalize = addressToNormalize.slice(2)
  }
  if (addressToNormalize.length !== 64) {
    throw new Error('Address length must be 64 or its size must be 256 bits')
  }
  return addressToNormalize
}

/**
 * Sleeps for the specified number of milliseconds.
 * @param timeMs - Time to sleep in milliseconds.
 * @returns Promise that resolves after the specified time.
 */
export const sleep = (timeMs: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs)
  })
}
