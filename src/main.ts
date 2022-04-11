import { Transaction, Blockchain } from './blockchain';
import { ec as EC } from 'elliptic';
import INITIAL_TRANSACTIONS from '../data/initial_transactions_data.json';
import { client1Wallet, client2Wallet, clientsWallets, fullNodeWallet } from './wallets/wallet';

const ec = new EC('secp256k1');

function setupNewBlockchain() {
  // Your private key goes here
  const keyPair = ec.keyFromPrivate(fullNodeWallet.privateKey);

  // From that we can calculate your public key (which doubles as your wallet address)
  const fullNodeAddress = keyPair.getPublic('hex');

  // Create new instance of Blockchain class
  const razCoin = new Blockchain(fullNodeAddress);

  // Mine Genesis block
  razCoin.minePendingTransactions();
  console.log('Genesis block mined\n');

  return { razCoin, fullNodeAddress, keyPair };
}

async function main() {
  const { razCoin, fullNodeAddress, keyPair } = setupNewBlockchain();

  // fill initial balances on wallets
  await razCoin.giveInitialBalanceToClients(clientsWallets.map(c => c.publicKey));

  // Initial load transactions from file
  console.log('Initial load transactions from file:');
  await razCoin.loadTransactionsIntoBlocks(INITIAL_TRANSACTIONS as Transaction[], clientsWallets);
  console.log('Loaded transactions from json file\n');

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
}

main().catch(console.error);
