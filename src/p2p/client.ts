import { Socket } from 'net';
import {
  extractMessage,
  extractPeersAndMyPort,
  extractPortFromIp,
  formatMessage,
  getPeerIps,
  toLocalIp
} from './common';

const prompt = require('prompt-async');
const topology = require('fully-connected-topology');

const sockets: Record<string, Socket> = {};
const { me: myPort, peers } = extractPeersAndMyPort();
console.log('---------------------');
console.log('Welcome client!');
console.log('my port - ', myPort);
console.log('peers to connect are - ', peers);
console.log('connecting to peers...');

const myIp = toLocalIp(myPort);
const peerIps = getPeerIps(peers);

// connect to peers
const peer = topology(myIp, peerIps);

peer.on('connection', (socket: Socket, peerIp: string) => {
  const peerPort = extractPortFromIp(peerIp);
  console.log('connected to peer - ', peerPort);
  console.log();
  sockets[peerPort] = socket;

  socket.on('data', (data: Buffer) => {
    const rawMessage = data.toString('utf-8').trim();

    const message = extractMessage(rawMessage);
    if (!message) {
      console.log('got invalid json msg from', peerPort);
      return;
    }

    console.log('got msg from', peerPort);

    if (message.type === 'balanceResponse') {
      console.log('your balance is:', message.balance);
      return;
    }

    if (message.type === 'transactionAdded' && message.from === myPort) {
      console.log('transaction added confirm');
      return;
    }

    if (message?.type === 'transactionAdded' && message?.to === myPort) {
      console.log('you got', message.amount, 'coins from', message.from);
      return;
    }
  });

  socket.on('end', () => {
    // on server disconnected kill myself
    if (peerPort === '4000') {
      console.log('\nserver died - exiting...');
      peer.destroy();
      process.exit();
    }
  });

  if (peerPort === '4000') {
    // Connected to full-node server, can ask questions now:
    askMenuLoop();
  }
});

async function ask(): Promise<boolean> {
  prompt.start();

  try {
    let answer = await prompt.get([
      {
        name: 'command',
        description: 'Press (1) for current balance, or (2) to send coins',
        required: true,
        type: 'string',
        pattern: /^[12]$/ // Regex validation 1 Or 2
      }
    ]);

    if (answer.command === '1') {
      console.log('getting your balance...');
      const jsonMsg = formatMessage({ type: 'getBalance' });
      sockets['4000'].write(jsonMsg);
      return true;
    }

    // command === '2' :
    try {
      answer = await prompt.get([
        {
          name: 'port',
          description: 'To what port do you want to send?',
          required: true,
          type: 'integer'
        },
        {
          name: 'coins',
          description: 'What coins amount?',
          required: true,
          type: 'number'
        }
      ]);

      const { port, coins } = answer;
      console.log('start transaction:', coins, 'to', port);
      const jsonMsg = formatMessage({ type: 'makeTransaction', to: port, amount: coins });
      sockets['4000'].write(jsonMsg);
      return true;
    } catch (err: any) {
      if (err?.message === 'canceled') return false;
      console.log('invalid transaction input', err?.message);
      return true;
    }
  } catch (err: any) {
    if (err?.message === 'canceled') return false;
    console.error('Error: ', err?.message);
    console.log('Try again...');
    return true;
  }
}

function askMenuLoop(): Promise<void> {
  // start CLI menu
  return ask()
    .then(async (shouldContinue: boolean) => {
      await delay(1000);
      if (shouldContinue) {
        console.log();
        return askMenuLoop(); // again
      }
    })
    .catch(console.error)
    .finally(() => {
      peer.destroy();
      console.log('\nBye bye!');
      process.exit();
    });
}

process.on('SIGINT', () => {
  // pressed CTRL+C
  peer.destroy();
  console.log('\nSIGINT exiting...');
  process.exit();
});

function delay(waitTimeInMs: number) {
  return new Promise(resolve => {
    setTimeout(resolve, waitTimeInMs);
  });
}
