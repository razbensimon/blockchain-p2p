import { ec as EC } from 'elliptic';
import { clientsWallets, fullNodeWallet } from './wallets/wallet';
import { Blockchain, Transaction } from './blockchain';
import INITIAL_TRANSACTIONS from '../data/initial_transactions_data.json';

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

export async function runBlockchain() {
  const { razCoin, fullNodeAddress, keyPair } = setupNewBlockchain();

  // fill initial balances on wallets
  await razCoin.giveInitialBalanceToClients(clientsWallets.map(c => c.publicKey));

  // Initial load transactions from file
  console.log('Initial load transactions from file:');
  await razCoin.loadTransactionsIntoBlocks(INITIAL_TRANSACTIONS as Transaction[], clientsWallets);
  console.log('Loaded transactions from json file\n');

  return { razCoin, fullNodeAddress, keyPair };
}
