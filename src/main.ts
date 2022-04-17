import { Transaction } from './blockchain';
import { client1Wallet, client2Wallet } from './wallets/wallet';
import { runBlockchain } from './run-common';

async function main() {
  const { razCoin, fullNodeAddress, keyPair } = await runBlockchain();

  // Create a transaction & sign it with your key
  console.log('Block 1:');
  const tx1 = new Transaction(fullNodeAddress, 'address2', 100);
  tx1.signTransaction(keyPair);
  razCoin.addTransaction(tx1);
  console.log('tx1 hash', tx1.calculateHash());

  // Mine block
  razCoin.minePendingTransactions();
  console.log();

  // ---------------------------------------------------------
  console.log('Block 2:');
  // Create second transaction
  const tx2 = new Transaction(fullNodeAddress, 'address1', 50);
  tx2.signTransaction(keyPair);
  razCoin.addTransaction(tx2);
  console.log('tx2 hash', tx2.calculateHash());

  // Create 3rd transaction in same block
  const tx3 = new Transaction(fullNodeAddress, 'address1', 10);
  tx3.signTransaction(keyPair);
  razCoin.addTransaction(tx3);
  console.log('tx3 hash', tx3.calculateHash());

  // Use bloom filter to search if transaction exists on block:
  console.log('is tx1 exists on LAST block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx1), '(before mining)');
  console.log('is tx3 exists on LAST block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx3), '(before mining)');

  // Mine block
  razCoin.minePendingTransactions();
  console.log();
  console.log('is tx1 exists on LAST block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx1), '(after mining)');
  console.log('is tx3 exists on LAST block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx3), '(after mining)');
  console.log();
  console.log('is tx1 exists on whole block-chain: ', razCoin.hasTransactionInBlockChain(tx1));
  console.log('is tx3 exists on whole block-chain: ', razCoin.hasTransactionInBlockChain(tx3));

  console.log();
  console.table([
    { name: 'Full Node (My)', Balance: razCoin.getBalanceOfAddress(fullNodeAddress) },
    { name: 'address1', Balance: razCoin.getBalanceOfAddress('address1') },
    { name: 'address2', Balance: razCoin.getBalanceOfAddress('address2') },
    { name: client1Wallet.publicKey.substring(0, 7), Balance: razCoin.getBalanceOfAddress(client1Wallet.publicKey) },
    { name: client2Wallet.publicKey.substring(0, 7), Balance: razCoin.getBalanceOfAddress(client2Wallet.publicKey) }
  ]);

  // Uncomment this line if you want to test tampering with the chain
  //(razCoin as any).chain[1].transactions[0].amount = 10;

  // Check if the chain is valid
  console.log();
  console.log('Blockchain valid?', razCoin.isChainValid() ? 'Yes!' : 'No :(');
  console.log('Count of coins in blockchain:', razCoin.printSumOfCoinsInBlockchain());
  console.log('Sum of coins mined by all blocks in blockchain:', razCoin.printSumOfCoinsMinedOnAllBlocks());
}

main().catch(console.error);
