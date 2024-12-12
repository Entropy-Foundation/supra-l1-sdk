import { describe, it, expect, vi } from 'vitest'
import {
  parseFunctionTypeArgs,
  fromUint8ArrayToJSArray,
  normalizeAddress,
  sleep
} from '../helpers'

namespace TxnBuilderTypes {
  export interface TypeTagStruct {
    value: StructTag
  }

  export interface StructTag {
    address: {
      toHexString: () => string
    }
    module_name: {
      value: string
    }
    name: {
      value: string
    }
    type_args: any[] // Simplified for testing
  }

  export type TypeTag = TypeTagStruct
}

interface FunctionTypeArgs {
  struct: {
    address: string
    module: string
    name: string
    type_args: any[]
  }
}

describe('Helper Functions', () => {
  describe('parseFunctionTypeArgs', () => {
    it('should correctly parse an array of TypeTagStruct objects', () => {
      const mockTypeTags: TxnBuilderTypes.TypeTag[] = [
        {
          value: {
            address: {
              toHexString: () =>
                '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
            },
            module_name: { value: 'TestModule' },
            name: { value: 'TestFunction' },
            type_args: []
          }
        },
        {
          value: {
            address: {
              toHexString: () =>
                '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
            },
            module_name: { value: 'AnotherModule' },
            name: { value: 'AnotherFunction' },
            type_args: []
          }
        }
      ]

      const expected: FunctionTypeArgs[] = [
        {
          struct: {
            address:
              '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            module: 'TestModule',
            name: 'TestFunction',
            type_args: []
          }
        },
        {
          struct: {
            address:
              '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            module: 'AnotherModule',
            name: 'AnotherFunction',
            type_args: []
          }
        }
      ]

      const result = parseFunctionTypeArgs(mockTypeTags as unknown as any)
      expect(result).toEqual(expected)
    })

    it('should return an empty array when given an empty input', () => {
      const mockTypeTags: TxnBuilderTypes.TypeTag[] = []
      const expected: FunctionTypeArgs[] = []
      const result = parseFunctionTypeArgs(mockTypeTags as unknown as any)
      expect(result).toEqual(expected)
    })
  })

  describe('fromUint8ArrayToJSArray', () => {
    it('should correctly convert Uint8Array[] to number[][]', () => {
      const mockUint8Arrays: Uint8Array[] = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5]),
        new Uint8Array([6])
      ]

      const expected: number[][] = [[1, 2, 3], [4, 5], [6]]

      const result = fromUint8ArrayToJSArray(mockUint8Arrays)
      expect(result).toEqual(expected)
    })

    it('should return an empty array when given an empty input', () => {
      const mockUint8Arrays: Uint8Array[] = []
      const expected: number[][] = []
      const result = fromUint8ArrayToJSArray(mockUint8Arrays)
      expect(result).toEqual(expected)
    })
  })

  describe('normalizeAddress', () => {
    it('should remove "0x" prefix and validate 64 characters', () => {
      const input =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const expected =
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const result = normalizeAddress(input)
      expect(result).toBe(expected)
    })

    it('should validate address without "0x" prefix', () => {
      const input =
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const expected =
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const result = normalizeAddress(input)
      expect(result).toBe(expected)
    })

    it('should throw an error if address length is not 64 characters', () => {
      const shortAddress = '0x1234'
      const longAddress = '0x' + '1'.repeat(65)

      expect(() => normalizeAddress(shortAddress)).toThrow(
        'Address length must be 64 or its size must be 256 bits'
      )
      expect(() => normalizeAddress(longAddress)).toThrow(
        'Address length must be 64 or its size must be 256 bits'
      )
    })

    it('should throw an error if address does not start with "0x" and is invalid length', () => {
      const invalidAddress = '1234'
      expect(() => normalizeAddress(invalidAddress)).toThrow(
        'Address length must be 64 or its size must be 256 bits'
      )
    })
  })

  describe('sleep', () => {
    it('should resolve after the specified time', async () => {
      vi.useFakeTimers()
      const sleepPromise = sleep(1000)

      // Fast-forward time
      vi.advanceTimersByTime(1000)

      await expect(sleepPromise).resolves.toBeUndefined()
      vi.useRealTimers()
    })

    it('should resolve immediately for zero duration', async () => {
      vi.useFakeTimers()
      const sleepPromise = sleep(0)

      // Fast-forward time
      vi.advanceTimersByTime(0)

      await expect(sleepPromise).resolves.toBeUndefined()
      vi.useRealTimers()
    })

    it('should handle negative durations gracefully', async () => {
      // Assuming the sleep function does not handle negative durations and behaves like setTimeout with negative delay
      vi.useFakeTimers()
      const sleepPromise = sleep(-1000)

      // Fast-forward time
      vi.advanceTimersByTime(0)

      await expect(sleepPromise).resolves.toBeUndefined()
      vi.useRealTimers()
    })
  })
})
