import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "../build/index.main.mjs";
import { promises as fs } from "fs";
import { test, expect } from "@jest/globals";

const stdlib = loadStdlib();

if (stdlib.connector === "ALGO") {
  process.exit(0);
}

const { ethers } = stdlib;
const myGasLimit = 5000000;

async function init() {
  console.log(1);
  await sleep(1000);
  console.log(2);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createTestAccounts() {
  const startingBalance = stdlib.parseCurrency(2);
  const [accAlice, accBob, accCreator] = await stdlib.newTestAccounts(
    3,
    startingBalance
  );

  accAlice.setDebugLabel("Alice").setGasLimit(myGasLimit);
  accBob.setDebugLabel("Bob").setGasLimit(myGasLimit);
  accCreator.setDebugLabel("Creator").setGasLimit(myGasLimit);

  return [accAlice, accBob, accCreator];
}

async function deploySLB(accAlice, location) {
  const startingBalance = stdlib.parseCurrency(2);
  const [acc1, acc2, acc3] = await stdlib.newTestAccounts(3, startingBalance);

  const remoteCtc = JSON.parse(await fs.readFile(location));
  const remoteABI = remoteCtc["abi"];
  const remoteBytecode = remoteCtc["bytecode"];
  const factory = new ethers.ContractFactory(
    remoteABI,
    remoteBytecode,
    acc1.networkAccount
  );
  const bond = await factory.deploy({
    gasLimit: myGasLimit,
  });
  await bond.deployTransaction.wait();

  await bond
    .connect(acc1.networkAccount)
    .setRoles(
      acc2.networkAccount.getAddress(),
      acc3.networkAccount.getAddress()
    );

  const addFunds = await bond.connect(acc2.networkAccount).fundBond({
    value: ethers.utils.parseUnits("200", "wei"),
  });
  await addFunds.wait();
  const nowUnix = Math.floor(Date.now() / 1000);

  const newBond = await bond
    .connect(acc2.networkAccount)
    .setBond(
      "Bond 1, KPI: Greenhouse gas emissions",
      [1, 0, 0],
      100,
      1,
      10,
      5,
      100,
      nowUnix + 50,
      nowUnix + 100,
      nowUnix + 150
    );
  await newBond.wait();

  const buyBond = await bond.connect(accAlice.networkAccount).mintBond(20);
  await buyBond.wait();

  return bond;
}

async function deployExchange(accCreator, bond, init) {
  const exchange = accCreator.contract(backend);
  await stdlib.withDisconnect(() =>
    exchange.p.Creator({
      slbToken: bond.address,
      slbContract: bond.address,
      startExchange: async function (contract) {
        await bond.approve(contract, 10);
        return init;
      },
      launched: stdlib.disconnect,
    })
  );
  console.log(`launched contract`);
  return exchange;
}

test("can deploy exchange", async () => {
  const [accAlice, accBob, accCreator] = await createTestAccounts();
  const bond = await deploySLB(
    accCreator,
    "artifacts/contracts/Bond.sol/SLB_Bond.json"
  );
  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 10,
    initTokens: 6,
  });

  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(10);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress())
    )
  ).toBe(6);
});

// // Approve transaction
// const retailer = accAlice.contract(backend, exchange.getInfo());

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

// console.log(await retailer.apis.Retailer.customGetBalance());
