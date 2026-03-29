import { execSync } from 'child_process';
import * as crypto from 'crypto';

export function getPassphrase(title: string = "Enter Passphrase"): string {
  try {
    if (process.platform === 'linux') {
      // Use zenity for Linux
      const result = execSync(`zenity --password --title="${title}"`, { stdio: ['inherit', 'pipe', 'pipe'] });
      return result.toString().trim();
    } else if (process.platform === 'darwin') {
      // Use osascript for macOS
      const script = `display dialog "${title}" default answer "" with title "Supra MCP Security" with icon caution with hidden answer`;
      const result = execSync(`osascript -e '${script}'`, { stdio: ['inherit', 'pipe', 'pipe'] });
      // osascript returns "button returned:OK, text returned:passphrase"
      const output = result.toString();
      const match = output.match(/text returned:(.*)$/);
      return match ? match[1].trim() : "";
    } else if (process.platform === 'win32') {
      // Use PowerShell for Windows
      const psCommand = `
        Add-Type -AssemblyName Microsoft.VisualBasic;
        [Microsoft.VisualBasic.Interaction]::InputBox("${title}", "Supra MCP Security", "");
      `;
      const result = execSync(`powershell -Command "${psCommand.replace(/\n/g, '')}"`, { stdio: ['inherit', 'pipe', 'pipe'] });
      return result.toString().trim();
    } else {
      throw new Error(`Unsupported platform for GUI prompts: ${process.platform}`);
    }
  } catch (error: unknown) {
    throw new Error(`Failed to get passphrase via GUI: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT = 'supra-mcp-salt'; // In a real app, use a unique salt per file if possible

function deriveKey(passphrase: string): Buffer {
  return crypto.scryptSync(passphrase, SALT, 32);
}

export function encrypt(text: string, passphrase: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData: string, passphrase: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted data format');
  
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const key = deriveKey(passphrase);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}
