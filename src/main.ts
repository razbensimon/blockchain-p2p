import { Transaction, Blockchain } from "./blockchain";
import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");

// Your private key goes here
const myKey = ec.keyFromPrivate(
  "e31fee1f597d6792180e718d10cf000b2586147e124694219898741d04c5daa4"
);

// From that we can calculate your public key (which doubles as your wallet address)
const myWalletAddress = myKey.getPublic("hex");

// Create new instance of Blockchain class
const razCoin = new Blockchain();

// Mine first block
razCoin.minePendingTransactions(myWalletAddress);

// Create a transaction & sign it with your key
const tx1 = new Transaction(myWalletAddress, "address2", 100);
tx1.signTransaction(myKey);
razCoin.addTransaction(tx1);

// Mine block
razCoin.minePendingTransactions(myWalletAddress);

// Create second transaction
const tx2 = new Transaction(myWalletAddress, "address1", 50);
tx2.signTransaction(myKey);
razCoin.addTransaction(tx2);

// Mine block
razCoin.minePendingTransactions(myWalletAddress);

console.log();
console.log(`Balance is ${razCoin.getBalanceOfAddress(myWalletAddress)}`);

// Uncomment this line if you want to test tampering with the chain
//(razCoin as any).chain[1].transactions[0].amount = 10;

// Check if the chain is valid
console.log();
console.log("Blockchain valid?", razCoin.isChainValid() ? "Yes" : "No");
