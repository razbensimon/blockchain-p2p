import SHA256 from 'crypto-js/sha256';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

class Transaction {
  private timestamp: number;
  private signature: string | null = null;

  constructor(public fromAddress: string | null, public toAddress: string, public amount: number) {
    this.timestamp = Date.now();
  }

  /**
   * Creates a SHA256 hash of the transaction
   */
  calculateHash(): string {
    return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
  }

  /**
   * Signs a transaction with the given signingKey (which is an Elliptic keypair
   * object that contains a private key). The signature is then stored inside the
   * transaction object and later stored on the blockchain.
   */
  signTransaction(signingKey: EC.KeyPair) {
    // You can only send a transaction from the wallet that is linked to your
    // key. So here we check if the fromAddress matches your publicKey
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets!');
    }

    // Calculate the hash of this transaction, sign it with the key
    // and store it inside the transaction object
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');

    this.signature = sig.toDER('hex');
  }

  /**
   * Checks if the signature is valid (transaction has not been tampered with).
   * It uses the fromAddress as the public key.
   */
  isValid(): boolean {
    // If the transaction doesn't have a from address we assume it's a
    // mining reward and that it's valid. You could verify this in a
    // different way (special field for instance)
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

export { Transaction };
