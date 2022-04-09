import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';
import { Transaction } from './transaction';

const debug = require('debug')('raz:block');

class Block {
  private nonce: number;
  private _previousHash: string = null!;
  private _hash: string = null!;
  private readonly _transactions: ReadonlyArray<Transaction> = [];

  constructor(private timestamp: number, transactions: ReadonlyArray<Transaction>, previousHash: string = '') {
    this._transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  public get hash(): string {
    return this._hash;
  }

  private set hash(value: string) {
    this._hash = value;
  }

  public get previousHash(): string {
    return this._previousHash;
  }

  private set previousHash(value: string) {
    this._previousHash = value;
  }

  public get transactions(): ReadonlyArray<Transaction> {
    return this._transactions;
  }

  /**
   * Returns the SHA256 of this block (by processing all the data stored
   * inside this block)
   */
  calculateHash(): string {
    return SHA256(this._previousHash + this.timestamp + JSON.stringify(this._transactions) + this.nonce).toString();
  }

  /**
   * Starts the mining process on the block. It changes the 'nonce' until the hash
   * of the block starts with enough zeros (= difficulty)
   */
  mineBlock(difficulty: number): void {
    while (this._hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this._hash = this.calculateHash();
    }

    debug(`Block mined: ${this._hash}`);
  }

  /**
   * Validates all the transactions inside this block (signature + hash) and
   * returns true if everything checks out. False if the block is invalid.
   */
  hasValidTransactions(): boolean {
    for (const tx of this._transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

export { Block };
