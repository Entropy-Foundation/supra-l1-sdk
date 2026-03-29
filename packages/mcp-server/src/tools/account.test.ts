import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAccountTool, importAccountTool, fundAccountTool } from './account';
import { SupraAccount, SupraClient, HexString } from "@supra-l1/sdk";
import * as security from '../utils/security';
import * as fs from 'fs';

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock("../utils/security", () => ({
  getPassphrase: vi.fn().mockReturnValue('test-passphrase'),
  encrypt: vi.fn().mockReturnValue('encrypted-data'),
  decrypt: vi.fn(),
}));

vi.mock("@scure/bip39", () => ({
  generateMnemonic: vi.fn().mockReturnValue('test mnemonic'),
  mnemonicToSeedSync: vi.fn(),
}));

vi.mock("@scure/bip39/wordlists/english", () => ({
  wordlist: [],
}));

vi.mock("@supra-l1/sdk", () => {
  const mockAccount = {
    toPrivateKeyObject: vi.fn().mockReturnValue({
      address: "0xaddress",
      publicKeyHex: "0xpublic",
      privateKeyHex: "0xprivate"
    })
  };
  
  const mockClient = {
    fundAccountWithFaucet: vi.fn().mockResolvedValue({ status: 'Success' }),
  };

  const MockSupraAccount = vi.fn().mockImplementation(function() {
    return mockAccount;
  });
  // @ts-ignore
  MockSupraAccount.fromDerivePath = vi.fn().mockReturnValue(mockAccount);
  
  const MockHexString = vi.fn().mockImplementation(function(val) {
    return { toString: () => val };
  });
  
  return {
    SupraAccount: MockSupraAccount,
    SupraClient: {
      init: vi.fn().mockResolvedValue(mockClient),
    },
    HexString: MockHexString
  };
});

describe('generateAccountTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct tool definition', () => {
    expect(generateAccountTool.name).toBe('generate_account');
    expect(generateAccountTool.inputSchema.properties).toHaveProperty('mnemonicPath');
    expect(generateAccountTool.inputSchema.properties).toHaveProperty('keyFilePath');
  });

  it('should generate account and save to files without returning secrets', async () => {
    const args = {
      mnemonicPath: 'mnemonic.txt',
      keyFilePath: 'key.pem'
    };

    const result = await generateAccountTool.handler(args);

    expect(security.getPassphrase).toHaveBeenCalled();
    expect(security.encrypt).toHaveBeenCalledWith('0xprivate', 'test-passphrase');
    expect(fs.writeFileSync).toHaveBeenCalledWith('mnemonic.txt', 'test mnemonic');
    expect(fs.writeFileSync).toHaveBeenCalledWith('key.pem', 'encrypted-data');
    
    expect(result).toHaveProperty('address', '0xaddress');
    expect(result).not.toHaveProperty('privateKey');
    expect(result).not.toHaveProperty('mnemonic');
    expect(result).toHaveProperty('mnemonicPath', 'mnemonic.txt');
    expect(result).toHaveProperty('keyFilePath', 'key.pem');
  });
});

describe('importAccountTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct tool definition', () => {
    expect(importAccountTool.name).toBe('import_account');
    expect(importAccountTool.inputSchema.properties).toHaveProperty('keyFilePath');
  });

  it('should import from mnemonic and save encrypted PEM', async () => {
    const args = {
      mnemonic: 'test mnemonic',
      keyFilePath: 'imported.pem'
    };

    const result = await importAccountTool.handler(args);

    expect(security.getPassphrase).toHaveBeenCalled();
    expect(SupraAccount.fromDerivePath).toHaveBeenCalled();
    expect(security.encrypt).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith('imported.pem', 'encrypted-data');
    
    expect(result).toHaveProperty('address', '0xaddress');
    expect(result).not.toHaveProperty('privateKey');
  });

  it('should import from private key and save encrypted PEM', async () => {
    const args = {
      privateKey: '0xprivate',
      keyFilePath: 'imported.pem'
    };

    const result = await importAccountTool.handler(args);

    expect(security.getPassphrase).toHaveBeenCalled();
    expect(security.encrypt).toHaveBeenCalledWith('0xprivate', 'test-passphrase');
    expect(fs.writeFileSync).toHaveBeenCalledWith('imported.pem', 'encrypted-data');
    
    expect(result).toHaveProperty('address', '0xaddress');
  });
});

describe('fundAccountTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should request tokens from faucet', async () => {
    const args = {
      address: '0xaddress',
      rpcUrl: 'http://localhost'
    };

    const result = await fundAccountTool.handler(args);

    expect(SupraClient.init).toHaveBeenCalledWith('http://localhost');
    expect(result).toEqual({ status: 'Success' });
  });
});
