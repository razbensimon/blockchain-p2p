import { delay } from '../utils';
import keyBy from 'lodash/keyBy';
import { Wallet } from '../wallets/wallet';
import { Block } from './block';
import { Transaction } from './transaction';
import { TransactionsQueue } from './transactionsQueue';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

const MAX_TRX_IN_BLOCK = 4;

class Blockchain {
  private pendingTransactions: TransactionsQueue;
  private readonly chain: Block[];
  private readonly difficulty: number;
  private readonly miningReward: number;

  constructor(private readonly miningRewardAddress: string) {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = new TransactionsQueue(MAX_TRX_IN_BLOCK);
    this.difficulty = 2;
    this.miningReward = 20;
  }

  createGenesisBlock(): Block {
    return new Block(Date.parse('2022-01-01'), [], '0');
  }

  /**
   * Returns the latest block on our chain. Useful when you want to create a
   * new Block and you need the hash of the previous Block.
   */
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Takes X pending transactions, puts them in a Block and starts the
   * mining process. It also adds a transaction to send the mining reward to
   * the miner address.
   * Returns boolean if done with all pending transactions or not.
   */
  minePendingTransactions(): boolean {
    const pendingTransactionsOnNextBlock = this.pendingTransactions.getPendingTransactionsOnNextBlock();

    if (pendingTransactionsOnNextBlock?.length === 0) {
      // no transaction to mine, exiting...
      return this.pendingTransactions.countPendingTransactions() === 0;
    }

    // add reward transaction!
    const rewardTx = new Transaction(null, this.miningRewardAddress, this.miningReward);
    const transactionsInBlock: Transaction[] = [...pendingTransactionsOnNextBlock, rewardTx];

    // Create and mine the block:
    const block = new Block(Date.now(), transactionsInBlock, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);
    this.pendingTransactions.blockHaveBeenMined();
    this.chain.push(block);

    const transactionsNumberLeft = this.pendingTransactions.countPendingTransactions();
    console.log(`Block mined: ${block.hash}, pending transactions left:`, transactionsNumberLeft);

    const isDoneMiningAll = transactionsNumberLeft === 0;
    return isDoneMiningAll;
  }

  async mineUntilNoPendingTransactions(waitTime?: number): Promise<void> {
    const amount = this.pendingTransactions.countPendingTransactions();
    if (amount === 0) {
      console.log('no transactions to mine...');
      return;
    }
    while (!this.minePendingTransactions()) {
      waitTime && (await delay(waitTime));
    }
    console.log(`Mined all pending ${amount} transactions`);
  }

  /**
   * Add a new transaction to the list of pending transactions (to be added
   * next time the mining process starts). This verifies that the given
   * transaction is properly signed.
   */
  addTransaction(transaction: Transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    // Verify the transaction
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    if (transaction.amount <= 0) {
      throw new Error('Transaction amount should be higher than 0');
    }

    // Making sure that the amount sent is not greater than existing balance
    const walletBalance = this.getBalanceOfAddress(transaction.fromAddress);
    if (walletBalance < transaction.amount) {
      throw new Error('Not enough balance');
    }

    // Get all other pending transactions for the "from" wallet
    const pendingTxForWallet = this.pendingTransactions
      .getPendingTransactionsOnLastBlock()
      .filter(tx => tx.fromAddress === transaction.fromAddress);

    // If the wallet has more pending transactions, calculate the total amount
    // of spend coins so far. If this exceeds the balance, we refuse to add this
    // transaction.
    if (pendingTxForWallet.length > 0) {
      const totalPendingAmount = pendingTxForWallet.map(tx => tx.amount).reduce((prev, curr) => prev + curr);

      const totalAmount = totalPendingAmount + transaction.amount;
      if (totalAmount > walletBalance) {
        throw new Error('Pending transactions for this wallet is higher than its balance.');
      }
    }

    // decide if this transaction going to be included in next block or not, inserting queue:
    this.pendingTransactions.addTransaction(transaction);
    //console.log('transaction added: %s', transaction);
  }

  /**
   * Returns the balance of a given wallet address.
   */
  getBalanceOfAddress(address: string): number {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  /**
   * Returns a list of all transactions that happened
   * to and from the given wallet address.
   */
  getAllTransactionsForWallet(address: string): Transaction[] {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    //console.log('get transactions for wallet count: %s', txs.length);
    return txs;
  }

  /**
   * Loops over all the blocks in the chain and verify if they are properly
   * linked together and nobody has tampered with the hashes. By checking
   * the blocks it also verifies the (signed) transactions inside them.
   */
  isChainValid(): boolean {
    // Check if the Genesis block hasn't been tampered with by comparing
    // the output of createGenesisBlock with the first block on our chain
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    // Check the remaining blocks on the chain to see if their hashes and
    // signatures are correct
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (previousBlock.hash !== currentBlock.previousHash) {
        return false;
      }

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
    }

    return true;
  }

  hasTransactionInBlockChain(transaction: Transaction) {
    for (let block of this.chain) {
      if (block.hasTransactionInBlock(transaction)) {
        return true;
      }
    }

    return false;
  }

  async loadTransactionsIntoBlocks(transactionPool: Transaction[], wallets: Wallet[]) {
    const walletsAsDictionary = keyBy(wallets, wallet => wallet.publicKey);
    for (const jsonTransaction of transactionPool) {
      if (!jsonTransaction.fromAddress || jsonTransaction.amount <= 0) {
        throw new Error('loaded transaction is invalid');
      }

      const newTransaction = new Transaction(
        jsonTransaction.fromAddress,
        jsonTransaction.toAddress,
        jsonTransaction.amount
      );

      const keyPair = ec.keyFromPrivate(walletsAsDictionary[jsonTransaction.fromAddress].privateKey);
      newTransaction.signTransaction(keyPair);
      this.addTransaction(newTransaction);
    }
    await this.mineUntilNoPendingTransactions();
  }

  async giveInitialBalanceToClients(wallets: string[]) {
    const initialBalance = 100;
    for (const wallet of wallets) {
      const transaction = new Transaction(null, wallet, initialBalance);
      this.pendingTransactions.addTransaction(transaction);
      console.log(`gave ${initialBalance} initial coins to ${wallet.substring(0, 7)}`);
    }
    await this.mineUntilNoPendingTransactions();
    console.log('Mined initial giveaway block\n');
  }

  printSumOfCoinsInBlockchain(): number {
    const addressToBalance: { [address: string]: number } = {};
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress) {
          if (!addressToBalance[trans.fromAddress]) {
            addressToBalance[trans.fromAddress] = 0;
          }
          addressToBalance[trans.fromAddress] -= trans.amount;
        }

        if (trans.toAddress) {
          if (!addressToBalance[trans.toAddress]) {
            addressToBalance[trans.toAddress] = 0;
          }
          addressToBalance[trans.toAddress] += trans.amount;
        }
      }
    }
    return Object.values(addressToBalance).reduce((a, b) => a + b, 0);
  }

  printSumOfCoinsMinedOnAllBlocks(): number {
    let coinsMined = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        coinsMined += trans.amount;
      }
    }
    return coinsMined;
  }
}

export { Blockchain };
