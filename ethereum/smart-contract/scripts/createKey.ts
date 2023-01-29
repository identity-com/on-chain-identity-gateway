import {Wallet} from "ethers";

const wallet = Wallet.createRandom();

console.log("Private key: " + wallet.privateKey);
console.log("Address: " + wallet.address);
