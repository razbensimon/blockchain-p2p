import { Transaction, Blockchain, Wallet } from './blockchain';
import { ec as EC } from 'elliptic';
import INITIAL_TRANSACTIONS from '../data/initial_transactions_data.json';

const ec = new EC('secp256k1');
const wallets: Wallet[] = [
  new Wallet(
    '04918f136cf6a26816b46e0ddf910f7fb70b7df22bb43f325ea300c4a6fcbed80dbe9555affdf12944ea4e9e183ac78f135c4547b73ebd9fe14e58ea35b7dcb51d',
    'e31fee1f597d6792180e718d10cf000b2586147e124694219898741d04c5daa4'
  ),
  new Wallet(
    '04f034327d7ac6956f281f943e1dcb82cb6fe0a73ee82bd97c4f8708c6a404395fe7b90054b1b019db0121e4eab8df8afe1085e21e9c718d159245da54c0e3374f',
    '98a3b2da3a3acce1471517c6418b9c87d9b42c7994b7859474ff8033b2aef09f'
  )
];
// Your private key goes here
const myKey = ec.keyFromPrivate('e31fee1f597d6792180e718d10cf000b2586147e124694219898741d04c5daa4');

// From that we can calculate your public key (which doubles as your wallet address)
const myWalletAddress = myKey.getPublic('hex');

// Create new instance of Blockchain class
const razCoin = new Blockchain(myWalletAddress);

// Mine Genesis block
razCoin.minePendingTransactions();

// Initial load transactions from file
razCoin.loadTransactionsIntoBlocks(INITIAL_TRANSACTIONS as Transaction[], wallets);
console.log('Loaded transactions from json file.');

// Create a transaction & sign it with your key
const tx1 = new Transaction(myWalletAddress, 'address2', 100);
tx1.signTransaction(myKey);
razCoin.addTransaction(tx1);
console.log('tx1 hash', tx1.calculateHash());

// Mine block
razCoin.minePendingTransactions();

// Create second transaction
const tx2 = new Transaction(myWalletAddress, 'address1', 50);
tx2.signTransaction(myKey);
razCoin.addTransaction(tx2);
console.log('tx2 hash', tx2.calculateHash());

// Create 3rd transaction in same block
const tx3 = new Transaction(myWalletAddress, 'address1', 10);
tx3.signTransaction(myKey);
razCoin.addTransaction(tx3);
console.log('tx3 hash', tx3.calculateHash());

// Use bloom filter to search if transaction exists on block:
console.log('is tx1 exists on block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx1));
console.log('is tx3 exists on block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx3));

// Mine block
razCoin.minePendingTransactions();
console.log('is tx1 exists on block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx1));
console.log('is tx3 exists on block: ', razCoin.getLatestBlock().hasTransactionInBlock(tx3));

console.log('is tx1 exists on whole block-chain: ', razCoin.hasTransactionInBlockChain(tx1));
console.log('is tx3 exists on whole block-chain: ', razCoin.hasTransactionInBlockChain(tx3));

console.log();
console.log(`My balance is ${razCoin.getBalanceOfAddress(myWalletAddress)}`);
console.log(`'address1' balance is ${razCoin.getBalanceOfAddress('address1')}`);

// Uncomment this line if you want to test tampering with the chain
//(razCoin as any).chain[1].transactions[0].amount = 10;

// Check if the chain is valid
console.log();
console.log('Blockchain valid?', razCoin.isChainValid() ? 'Yes' : 'No');
