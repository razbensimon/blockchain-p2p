import SHA256 from 'crypto-js/sha256';
import { MerkleTree } from 'merkletreejs';
import { BloomFilter } from 'bloom-filters';
import { Transaction } from './transaction';

class Block {
  private nonce: number;
  private _previousHash: string = null!;
  private _hash: string = null!;
  private readonly _transactions: ReadonlyArray<Transaction> = [];
  private tree: MerkleTree;
  private filter: BloomFilter;

  constructor(private timestamp: number, transactions: ReadonlyArray<Transaction>, previousHash: string = '') {
    this._transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;

    // Merkle Tree:
    const leaves = transactions.map(transaction => transaction.calculateHash());
    this.tree = new MerkleTree(leaves, SHA256);

    this.hash = this.calculateHash();

    // Create bloom filter optimal for a collections of items and a desired error rate
    const errorRate = 0.04;
    this.filter = BloomFilter.from(leaves, errorRate);
    for (let transaction of this.transactions) {
      this.filter.add(transaction.calculateHash());
    }
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
    const rootHash = this.tree.getRoot().toString('hex');
    return SHA256(
      this._previousHash + this.timestamp + JSON.stringify(this._transactions) + this.nonce + rootHash
    ).toString();
  }

  /**
   * Starts the mining process on the block. It changes the 'nonce' until the hash
   * of the block starts with enough zeros (= difficulty)
   */
  mineBlock(difficulty: number): void {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    //console.log(`Block mined: ${this.hash}`);
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

  hasTransactionInBlock(transaction: Transaction): boolean {
    // 'false' is truly false
    // 'true' may be false positive
    let target = transaction.calculateHash();
    let bloomFilterResult = this.filter.has(target);
    if (!bloomFilterResult) return false;

    // Bloom-Filter returned true.
    // Now need to check that it is not a false positive - So we search on our MerkleTree:
    const proof = this.tree.getProof(target);
    return this.tree.verify(proof, target, this.tree.getRoot());
  }
}

export { Block };
