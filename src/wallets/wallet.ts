export class Wallet {
  constructor(public readonly publicKey: string, public readonly privateKey: string) {}
}

export const fullNodeWallet = new Wallet(
  '04327a61231effa94d04e3558fe4cab81405e50db6835acd864aef8267d709fe6a55877e10361b8ff34d8bb09e16313418414605e9ee61f3c7f272d4946fa048ed',
  '7c8a6f2b39e9e0061764b23dbf299c4d7293a8c5020c1ba09f63e7ea2f8c4383'
);

export const client1Wallet = new Wallet(
  '04918f136cf6a26816b46e0ddf910f7fb70b7df22bb43f325ea300c4a6fcbed80dbe9555affdf12944ea4e9e183ac78f135c4547b73ebd9fe14e58ea35b7dcb51d',
  'e31fee1f597d6792180e718d10cf000b2586147e124694219898741d04c5daa4'
);

export const client2Wallet = new Wallet(
  '04f034327d7ac6956f281f943e1dcb82cb6fe0a73ee82bd97c4f8708c6a404395fe7b90054b1b019db0121e4eab8df8afe1085e21e9c718d159245da54c0e3374f',
  '98a3b2da3a3acce1471517c6418b9c87d9b42c7994b7859474ff8033b2aef09f'
);

export const clientsWallets: Wallet[] = [client1Wallet, client2Wallet];
