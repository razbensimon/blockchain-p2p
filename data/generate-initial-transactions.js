const fs = require('fs');

const TRANSACTIONS_NUMBER = 30;

const WALLET_1 =
  '04918f136cf6a26816b46e0ddf910f7fb70b7df22bb43f325ea300c4a6fcbed80dbe9555affdf12944ea4e9e183ac78f135c4547b73ebd9fe14e58ea35b7dcb51d';
const WALLET_2 =
  '04f034327d7ac6956f281f943e1dcb82cb6fe0a73ee82bd97c4f8708c6a404395fe7b90054b1b019db0121e4eab8df8afe1085e21e9c718d159245da54c0e3374f';

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const transactions = [];

for (let i = 0; i < TRANSACTIONS_NUMBER; i++) {
  const randomBoolean = Math.random() < 0.5;

  transactions.push({
    fromAddress: randomBoolean ? WALLET_1 : WALLET_2,
    toAddress: randomBoolean ? WALLET_2 : WALLET_1,
    amount: randomInteger(5, 20)
  });
}

// print pretty json
const jsonContent = JSON.stringify(transactions, null, 2);

fs.writeFile('initial_transactions_data.json', jsonContent, 'utf8', function (err) {
  if (err) {
    console.log('An error occurred while writing JSON Object to File.');
    return console.log(err);
  }

  console.log('JSON file has been saved.');
});
