import {
    loadStdlib,
    util
} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import {
    promises as fs
} from "fs";
const {
    thread
} = util;
const stdlib = loadStdlib();

if (stdlib.connector === 'ALGO') {
    process.exit(0);
}
const {
    ethers
} = stdlib;

const startingBalance = stdlib.parseCurrency(100);
const [accAlice, accBob, accCreator] = await stdlib.newTestAccounts(3, startingBalance);

const myGasLimit = 5000000;
accAlice.setDebugLabel('Alice').setGasLimit(myGasLimit);
accBob.setDebugLabel('Bob').setGasLimit(myGasLimit);
accCreator.setDebugLabel('Creator').setGasLimit(myGasLimit);

console.log(`Alice remote: make factory`);
const compiled = JSON.parse(await fs.readFile('./build/index.sol.json'));
const remoteCtc = compiled["contracts"]["/home/gungy2/code/project/SLB-marketplace/solidity/index.sol:SimpleToken"];
const remoteABI = remoteCtc["abi"];
const remoteBytecode = remoteCtc["bin"];
const factory = new ethers.ContractFactory(remoteABI, remoteBytecode, accAlice.networkAccount);
console.log(`Alice remote: deploy`);
const token = await factory.deploy("MyToken", "MTK", {
    gasLimit: myGasLimit
});
console.log(`Alice remote: wait for deploy: ${token.deployTransaction.hash}`);
const deploy_r = await token.deployTransaction.wait();
console.log(`Alice remote: saw deploy: ${deploy_r.blockNumber}`);
const remoteAddr = token.address;
console.log(`Alice remote: deployed: ${remoteAddr}`);
console.log(await token.balanceOf(accAlice.getAddress()));

await token.mint(accAlice.getAddress(), 10);

// Deploy Dapp
const creatorToken = new ethers.Contract(token.address, remoteABI, accCreator.networkAccount);
await token.mint(accCreator.getAddress(), 10);
console.log(`Creator now has: ${await creatorToken.balanceOf(accCreator.getAddress())}`);
const exchange = accCreator.contract(backend);

// creatorToken.approve(exchange.getContractAddress(), 10000);
// console.log(accCreator.getAddress());
// console.log(await exchange.getContractAddress());
// console.log(await token.allowance(accCreator.getAddress(), await exchange.getContractAddress()));

await stdlib.withDisconnect(() => exchange.p.Creator({
    slbContractAddress: token.address,
    startExchange: async function (contract) {
        await creatorToken.approve(contract, 6);

        console.log(`Allowance: ${await creatorToken.allowance(accCreator.getAddress(), contract)}`);
        return {
            initSlbs: 6,
            initTokens: 10,
        }
    },
    launched: stdlib.disconnect
}));

console.log(`launched contract`);

// Approve transaction
// const retailer = accAlice.contract(backend, exchange.getInfo());
// token.approve(exchange.getContractAddress(), 2);

// console.log("CALLING THE CONTRACT");
// console.log(await retailer.apis.Retailer.sellSLBs(2));
// console.log("HERE");