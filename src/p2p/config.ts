import { client1Wallet, client2Wallet, fullNodeWallet, Wallet } from '../wallets/wallet';

const portToWalletMapping: Record<string, Wallet> = {
  '4000': fullNodeWallet,
  '4001': client1Wallet,
  '4002': client2Wallet
};

export default {
  portToWalletMapping
};
