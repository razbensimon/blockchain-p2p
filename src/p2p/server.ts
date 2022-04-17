import { Socket } from 'net';
import {
  extractMessage,
  extractPeersAndMyPort,
  extractPortFromIp,
  formatMessage,
  getPeerIps,
  toLocalIp
} from './common';
import { runBlockchain } from '../run-common';
import { Wallet } from '../wallets/wallet';
import config from './config';
import { Transaction } from '../blockchain';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');
const topology = require('fully-connected-topology');

const sockets: Record<string, Socket> = {};
const wallets: Record<string, Wallet> = {};
const { me: myPort, peers } = extractPeersAndMyPort();
console.log('---------------------');
console.log('Welcome server!');
console.log('my port - ', myPort);
console.log('peers to connect are - ', peers);
console.log('connecting to peers...');

const myIp = toLocalIp(myPort);
const peerIps = getPeerIps(peers);

// const interval = Math.random() * 5 * 1000 + 5000;

async function main() {
  const { razCoin } = await runBlockchain();

  //connect to peers
  let peer = topology(myIp, peerIps);

  peer.on('connection', (socket: Socket, peerIp: string) => {
    const peerPort = extractPortFromIp(peerIp);
    console.log('connected to peer - ', peerPort);
    sockets[peerPort] = socket;
    wallets[peerPort] = config.portToWalletMapping[peerPort];
    const peerAddress = wallets[peerPort].publicKey;
    const peerPrivateKey = wallets[peerPort].privateKey;

    socket.on('data', (data: Buffer) => {
      try {
        const rawMessage = data.toString('utf-8').trim();
        const message = extractMessage(rawMessage);
        if (!message) {
          // validation
          console.log('got invalid json msg from', peerPort);
          return;
        }

        console.log('got msg from', peerPort);

        if (message.type === 'getBalance') {
          const peerBalance = razCoin.getBalanceOfAddress(peerAddress);
          socket.write(formatMessage({ type: 'balanceResponse', balance: peerBalance }));
          return;
        }

        if (message.type === 'makeTransaction') {
          if (!message.to || !message.amount) {
            console.log('got invalid transaction from', peerPort);
            return;
          }

          const targetAddress = wallets[message.to]?.publicKey;
          if (!targetAddress) {
            console.log("can't transfer coins to unknown wallet address");
            return;
          }

          let newTransaction = new Transaction(peerAddress, targetAddress, message.amount);
          const keyPair = ec.keyFromPrivate(peerPrivateKey);
          newTransaction.signTransaction(keyPair);
          razCoin.addTransaction(newTransaction);
          console.log('transaction of', message.amount, 'from', peerPort, 'to', message.to, 'added');
          razCoin.minePendingTransactions();

          socket.write(
            formatMessage({
              type: 'transactionAdded',
              from: peerPort,
              to: message.to,
              amount: message.amount
            })
          );
          return;
        }
      } catch (err: any) {
        console.warn('Bad message:', err?.message);
      }
    });
  });

  process.on('SIGINT', () => {
    // pressed CTRL+C
    peer.destroy();
    console.log('\nSIGINT exiting...');
    process.exit();
  });
}

main().catch(console.error);
