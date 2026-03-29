import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createEntryFunctionTxTool, 
  createScriptTxTool, 
  signTransactionTool, 
  submit_transaction_tool 
} from './transaction';
import { SupraClient, HexString, SupraAccount } from "@supra-l1/sdk";
import * as security from '../utils/security';
import * as fs from 'fs';

vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('encrypted-data'),
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock("../utils/security", () => ({
  getPassphrase: vi.fn().mockReturnValue('test-passphrase'),
  decrypt: vi.fn().mockReturnValue('0xprivate'),
  encrypt: vi.fn(),
}));

vi.mock("@supra-l1/sdk", () => {
  const mockClient = {
    createSerializedRawTxObject: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    createSerializedScriptTxPayloadRawTxObject: vi.fn().mockReturnValue(new Uint8Array([4, 5, 6])),
    getAccountInfo: vi.fn().mockResolvedValue({ sequence_number: 10n }),
    getChainId: vi.fn().mockResolvedValue({ value: 6 }),
    sendTxUsingSerializedRawTransactionAndSignature: vi.fn().mockResolvedValue({ txHash: '0xhash' }),
  };
  
  const mockAccount = {
    address: vi.fn().mockReturnValue({ toString: () => "0xaddress" }),
    toPrivateKeyObject: vi.fn().mockReturnValue({ address: "0xaddress" }),
    signBuffer: vi.fn().mockReturnValue({ toString: () => "0xsignature" }),
    pubKey: vi.fn().mockReturnValue({ toString: () => "0xpubkey" }),
  };

  const MockSupraAccount = vi.fn().mockImplementation(function() {
    return mockAccount;
  });
  
  const MockHexString = vi.fn().mockImplementation(function(val) {
    return { toString: () => val };
  });
  
  return {
    SupraClient: {
      init: vi.fn().mockResolvedValue(mockClient),
      getSupraTransactionSignatureMessage: vi.fn().mockReturnValue(new Uint8Array([7, 8, 9])),
      createSignedTransaction: vi.fn().mockReturnValue({}),
      deriveTransactionHash: vi.fn().mockReturnValue('0xhash'),
    },
    SupraAccount: MockSupraAccount,
    HexString: MockHexString,
    TxnBuilderTypes: {
      RawTransaction: {
        deserialize: vi.fn().mockReturnValue({}),
      },
      TypeTagParser: vi.fn().mockImplementation(() => ({
        parseTypeTag: vi.fn().mockReturnValue({}),
      })),
      AccountAddress: {
        fromHex: vi.fn().mockReturnValue({}),
      }
    },
    BCS: {
      Deserializer: vi.fn(),
      bcsSerializeU8: vi.fn(),
      bcsSerializeU16: vi.fn(),
      bcsSerializeU32: vi.fn(),
      bcsSerializeUint64: vi.fn(),
      bcsSerializeU128: vi.fn(),
      bcsSerializeU256: vi.fn(),
      bcsSerializeBool: vi.fn(),
      bcsSerializeStr: vi.fn(),
      bcsSerializeBytes: vi.fn(),
      bcsToBytes: vi.fn(),
    }
  };
});

describe('createEntryFunctionTxTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct tool definition', () => {
    expect(createEntryFunctionTxTool.name).toBe('create_entry_function_tx');
    expect(createEntryFunctionTxTool.inputSchema.properties).toHaveProperty('keyFilePath');
  });

  it('should build entry function tx using key file and typed args', async () => {
    const args = {
      keyFilePath: 'key.pem',
      moduleAddr: '0x1',
      moduleName: 'supra_account',
      functionName: 'transfer',
      functionArgs: [
        { type: 'address', value: '0x2' },
        { type: 'u64', value: '1000' }
      ],
      rpcUrl: 'http://localhost'
    };

    const result = await createEntryFunctionTxTool.handler(args);

    expect(fs.readFileSync).toHaveBeenCalledWith('key.pem', 'utf8');
    expect(security.getPassphrase).toHaveBeenCalled();
    expect(security.decrypt).toHaveBeenCalled();
    expect(result).toHaveProperty('serializedRawTransaction');
    expect(result).toHaveProperty('sequenceNumber', '10');
  });
});

describe('signTransactionTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sign a raw transaction with salt', async () => {
    const args = {
      keyFilePath: 'key.pem',
      serializedRawTransaction: '0x123'
    };

    const result = await signTransactionTool.handler(args);

    expect(security.getPassphrase).toHaveBeenCalled();
    expect(result).toHaveProperty('signature', '0xsignature');
    expect(result).toHaveProperty('publicKey', '0xpubkey');
  });
});

describe('submit_transaction_tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit a signed transaction', async () => {
    const args = {
      serializedRawTransaction: '0x123',
      signature: '0xsignature',
      senderPublicKey: '0xpubkey',
      rpcUrl: 'http://localhost'
    };

    const result = await submit_transaction_tool.handler(args);

    expect(SupraClient.init).toHaveBeenCalledWith('http://localhost');
    expect(result).toHaveProperty('txHash', '0xhash');
  });
});
