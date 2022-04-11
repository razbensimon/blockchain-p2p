import last from 'lodash/last';
import first from 'lodash/first';
import sum from 'lodash/sum';
import { Transaction } from './transaction';

export class TransactionsQueue {
  private readonly blockLimit: number;
  private blocks: Array<Transaction[]> = [];

  constructor(blockLimit: number) {
    if (blockLimit <= 1) throw new Error('limit should be at least 2');
    // reduce 1 to give space for reward's transaction
    this.blockLimit = blockLimit - 1;
    this.blocks.push([]);
  }

  /**
   add transaction to next block.
   if there is no room, it wil create new pending block
   */
  addTransaction(transaction: Transaction): void {
    if (this.blocks.length === 0) {
      // add first block
      this.blocks.push([transaction]);
      return;
    }

    const lastBlock = last(this.blocks);
    if (lastBlock!.length === this.blockLimit) {
      this.blocks.push([transaction]); // open new block
      return;
    }

    // insert to existing last block
    lastBlock!.push(transaction);
  }

  /**
   * After block have been mined,
   * call this function to clean the and remove those mined transactions from
   * the pending queue.
   */
  blockHaveBeenMined(): void {
    // remove first block that already mined
    this.blocks.splice(0, 1);
  }

  getPendingTransactionsOnNextBlock(): Transaction[] {
    return first(this.blocks) ?? [];
  }

  getPendingTransactionsOnLastBlock(): Transaction[] {
    return last(this.blocks) ?? [];
  }

  countPendingTransactions(): number {
    return sum(this.blocks.map(block => block.length));
  }
}
