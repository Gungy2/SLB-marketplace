import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import * as fs from 'fs';
const stdlib = loadStdlib();

if ( stdlib.connector === 'ALGO' ) { process.exit(0); }
const { ethers } = stdlib;

const startingBalance = stdlib.parseCurrency(100);
const [ accAlice, accBob, accCreator ] = await stdlib.newTestAccounts(3, startingBalance);

const myGasLimit = 5000000;
accAlice.setDebugLabel('Alice').setGasLimit(myGasLimit);
accBob.setDebugLabel('Bob').setGasLimit(myGasLimit);
accCreator.setDebugLabel('Creator').setGasLimit(myGasLimit);

const gil = await stdlib.launchToken(accCreator, "gil", "GIL");
await gil.mint(accAlice, startingBalance);
await gil.mint(accAlice, startingBalance);

const zorkmid = await stdlib.launchToken(accCreator, "zorkmid", "ZMD");
await zorkmid.mint(accAlice, startingBalance);
await zorkmid.mint(accAlice, startingBalance);

console.log(`Alice remote: make factory`);
const compiled = JSON.parse(await fs.readFileSync('./build/index.sol.json'));
// console.log(`Alice read compiled file: ${JSON.stringify(compiled)}`);
const remoteCtc = compiled["contracts"]["/home/gungy2/code/project/SLB-marketplace/solidity/index.sol:SimpleToken"];
const remoteABI = remoteCtc["abi"];
const remoteBytecode = remoteCtc["bin"];
const factory = new ethers.ContractFactory(remoteABI, remoteBytecode, accAlice.networkAccount);
console.log(`Alice remote: deploy`);
const token = await factory.deploy("MyToken", "MTK", { gasLimit: myGasLimit });
console.log(`Alice remote: wait for deploy: ${token.deployTransaction.hash}`);
const deploy_r = await token.deployTransaction.wait();
console.log(`Alice remote: saw deploy: ${deploy_r.blockNumber}`);
const remoteAddr = token.address;
console.log(`Alice remote: deployed: ${remoteAddr}`);
console.log(await token.balanceOf(accAlice.getAddress()));

await token.mint(accAlice.getAddress(), 10);
console.log("After: ");
console.log(await token.balanceOf(accAlice.getAddress()));

const exchange = accCreator.contract(backend);
await stdlib.withDisconnect(() => exchange.p.Creator({
  slbContractAddress: token.address,
  launched: stdlib.disconnect,
}));
console.log(`launched contract`);

// Approve transaction
const retailer = accAlice.contract(backend, exchange.getInfo());
token.approve(exchange.getContractAddress(), 2);

console.log("CALLING THE CONTRACT");
console.log(await retailer.apis.Retailer.sellSLBs(2));
console.log("HERE");