import { BloomFilter } from 'bloom-filters';

// create a Bloom Filter with a size of 10 and 4 hash functions
const filter = new BloomFilter(10, 4);

// insert data
filter.add('alice');
filter.add('bob');

// lookup for some data
console.log('filter has bob:', filter.has('bob')); // output: true
console.log('filter has raz:', filter.has('raz')); // output: false

// print the error rate
console.log('error rate:', filter.rate());
