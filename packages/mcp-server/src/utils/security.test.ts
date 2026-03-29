import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getPassphrase, encrypt, decrypt } from './security';
import { execSync } from 'child_process';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('Security Utilities - GUI Prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use zenity on linux', () => {
    vi.stubGlobal('process', { ...process, platform: 'linux' });
    vi.mocked(execSync).mockReturnValue(Buffer.from('linux-passphrase\n'));
    
    const result = getPassphrase('Enter passphrase');
    
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('zenity --password'), expect.any(Object));
    expect(result).toBe('linux-passphrase');
    vi.unstubAllGlobals();
  });

  it('should use osascript on darwin (macOS)', () => {
    vi.stubGlobal('process', { ...process, platform: 'darwin' });
    vi.mocked(execSync).mockReturnValue(Buffer.from('button returned:OK, text returned:mac-passphrase'));
    
    const result = getPassphrase('Enter passphrase');
    
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('osascript -e'), expect.any(Object));
    expect(result).toBe('mac-passphrase');
    vi.unstubAllGlobals();
  });

  it('should use powershell on win32', () => {
    vi.stubGlobal('process', { ...process, platform: 'win32' });
    vi.mocked(execSync).mockReturnValue(Buffer.from('win-passphrase\r\n'));
    
    const result = getPassphrase('Enter passphrase');
    
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('powershell'), expect.any(Object));
    expect(result).toBe('win-passphrase');
    vi.unstubAllGlobals();
  });
});

describe('Security Utilities - Encryption', () => {
  const passphrase = 'test-passphrase';
  const plainText = 'sensitive-data';

  it('should encrypt and decrypt correctly', () => {
    const encrypted = encrypt(plainText, passphrase);
    expect(encrypted).not.toBe(plainText);
    
    const decrypted = decrypt(encrypted, passphrase);
    expect(decrypted).toBe(plainText);
  });

  it('should fail to decrypt with wrong passphrase', () => {
    const encrypted = encrypt(plainText, passphrase);
    expect(() => decrypt(encrypted, 'wrong-passphrase')).toThrow();
  });
});
