import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
import { promises as fs } from "fs";

const stdlib = loadStdlib();

if (stdlib.connector === "ALGO") {
  process.exit(0);
}
const { ethers } = stdlib;

const ganacheProvider = new ethers.providers.JsonRpcProvider(
  "http://127.0.0.1:7545"
);
stdlib.setProvider(ganacheProvider);
const faucet = ganacheProvider.getSigner(0);
console.log(faucet);
stdlib.setFaucet(stdlib.connectAccount(faucet));

const startingBalance = stdlib.parseCurrency(2);
const [accAlice, accBob, accCreator] = await stdlib.newTestAccounts(
  3,
  startingBalance
);

const myGasLimit = 5000000;
accAlice.setDebugLabel("Alice").setGasLimit(myGasLimit);
accBob.setDebugLabel("Bob").setGasLimit(myGasLimit);
accCreator.setDebugLabel("Creator").setGasLimit(myGasLimit);

// console.log(`Alice remote: make factory`);
// const compiled = JSON.parse(await fs.readFile("./build/index.sol.json"));
// const remoteCtc =
//   compiled["contracts"][
//     "/home/gungy2/code/project/SLB-marketplace/solidity/index.sol:SimpleToken"
//   ];
// const remoteABI = remoteCtc["abi"];
// const remoteBytecode = remoteCtc["bin"];
// const factory = new ethers.ContractFactory(
//   remoteABI,
//   remoteBytecode,
//   accAlice.networkAccount
// );
// console.log(`Alice remote: deploy`);
// const token = await factory.deploy("MyToken", "MTK", {
//   gasLimit: myGasLimit,
// });
// console.log(`Alice remote: wait for deploy: ${token.deployTransaction.hash}`);
// const deploy_r = await token.deployTransaction.wait();
// console.log(`Alice remote: saw deploy: ${deploy_r.blockNumber}`);
const remoteAddr = "0x24D197bcdfd8FA66f78fDE65BdB7bfC9F426F1fD";
console.log(`Alice remote: deployed: ${remoteAddr}`);
// console.log(await token.balanceOf(accAlice.getAddress()));

// await token.mint(accAlice.getAddress(), 10);

// // Deploy Dapp
// const creatorToken = new ethers.Contract(
//   token.address,
//   remoteABI,
//   accCreator.networkAccount
// );
// await token.mint(accCreator.getAddress(), 1000);
// console.log(
//   `Creator now has: ${await creatorToken.balanceOf(accCreator.getAddress())}`
// );
const exchange = accCreator.contract(backend);

await stdlib.withDisconnect(() =>
  exchange.p.Creator({
    slbToken: remoteAddr,
    slbContract: remoteAddr,
    startExchange: async function (contract) {
      // await creatorToken.approve(contract, 1000);

      // console.log(
      //   `Allowance: ${await creatorToken.allowance(
      //     accCreator.getAddress(),
      //     contract
      //   )}`
      // );
      return {
        initSlbs: 10,
        initTokens: 6,
      };
    },
    launched: stdlib.disconnect,
  })
);

console.log(`launched contract`);

// Approve transaction
const retailer = accAlice.contract(backend, exchange.getInfo());

// console.log(
//   `Alice now has: ${await creatorToken.balanceOf(accAlice.getAddress())} SLBs`
// );
// const initially = await stdlib.balanceOf(accAlice.getAddress());
// console.log((await retailer.apis.Retailer.buySLBs(4)).toString());
// console.log(
//   `Alice now has: ${await creatorToken.balanceOf(accAlice.getAddress())}`
// );
// console.log(
//   `Alice has spent: ${
//     initially - (await stdlib.balanceOf(accAlice.getAddress()))
//   } ETH`
// );

// console.log(
//   `Alice now has: ${await creatorToken.balanceOf(accAlice.getAddress())} SLBs`
// );
// const initially2 = await stdlib.balanceOf(accAlice.getAddress());
// console.log((await retailer.apis.Retailer.sellSLBs(4)).toString());
// console.log(
//   `Alice now has: ${await creatorToken.balanceOf(accAlice.getAddress())}`
// );
// console.log(
//   `Alice has spent: ${
//     initially2 - (await stdlib.balanceOf(accAlice.getAddress()))
//   } ETH`
// );

console.log(await retailer.apis.Retailer.customGetBalance());
