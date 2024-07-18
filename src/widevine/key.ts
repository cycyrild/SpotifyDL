import * as forge from 'node-forge';
import * as licenseProtocol from './license_protocol';
import { Buffer } from 'buffer';


export class Key {
    public license: licenseProtocol.License_KeyContainer_KeyType;
    public kid: string | null;
    public keyValue: Uint8Array;
    public permissions: string[];

    constructor(type: licenseProtocol.License_KeyContainer_KeyType, kid: string | null, key: Uint8Array, permissions: string[]) {
        this.license = type;
        this.kid = kid;
        this.keyValue = key;
        this.permissions = permissions;
    }

    static fromKeyContainer(keyContainer: licenseProtocol.License_KeyContainer, encryptionKey: Uint8Array): Key {

        if (!keyContainer.iv || !keyContainer.key) {
            throw new Error('Invalid keyContainer: iv or key is undefined');
        }
        
        const iv = forge.util.createBuffer(keyContainer.iv);
        const keyBuffer = forge.util.createBuffer(encryptionKey);

        // Create a buffer for the encrypted key
        const encryptedKeyBuffer = forge.util.createBuffer(keyContainer.key);

        // Configure AES parameters
        const decipher = forge.cipher.createDecipher('AES-CBC', keyBuffer);
        decipher.start({ iv: iv });
        decipher.update(encryptedKeyBuffer);
        const success = decipher.finish();
        
        if (!success) {
            throw new Error('Decryption failed');
        }

        const decryptedKey = new Uint8Array(decipher.output.getBytes().split('').map(c => c.charCodeAt(0)));

        if (!keyContainer.type) {
            throw new Error('Invalid keyContainer: type is undefined');
        }

        return new Key(
            keyContainer.type,
            null,
            decryptedKey,
            []
        );
    }
}