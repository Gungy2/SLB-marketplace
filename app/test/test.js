import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "../build/index.main.mjs";
import { promises as fs } from "fs";
import { test, expect } from "@jest/globals";

const stdlib = loadStdlib("ETH");

const { ethers } = stdlib;
const myGasLimit = 5000000;

async function createTestAccounts() {
  const startingBalance = stdlib.parseCurrency(10);
  const [accAlice, accBob, accCreator] = await stdlib.newTestAccounts(
    3,
    startingBalance
  );

  accAlice.setDebugLabel("Alice").setGasLimit(myGasLimit);
  accBob.setDebugLabel("Bob").setGasLimit(myGasLimit);
  accCreator.setDebugLabel("Creator").setGasLimit(myGasLimit);

  return [accAlice, accBob, accCreator];
}

async function deploySLB(location) {
  const startingBalance = stdlib.parseCurrency(5);
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

  return bond;
}

async function deployExchange(accCreator, bond, init) {
  const exchange = accCreator.contract(backend);
  await stdlib.withDisconnect(() =>
    exchange.p.Creator({
      slbToken: bond.address,
      slbContract: bond.address,
      startExchange: async function (contract) {
        await bond.approve(contract, init.initSlbs);
        return init;
      },
      launched: stdlib.disconnect,
    })
  );
  return exchange;
}

test("can deploy exchange", async () => {
  const [accCreator] = await createTestAccounts();
  const bond = await deploySLB("artifacts/contracts/Bond.sol/SLB_Bond.json");
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 10,
    initTokens: 40,
  });

  const price = (await exchange.v.Main.price())[1];
  expect(stdlib.bigNumberToNumber(price)).toBe(4);

  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(10);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress())
    )
  ).toBe(40);
});

test("can buy SLBs from the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB("artifacts/contracts/Bond.sol/SLB_Bond.json");
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 20,
    initTokens: 200,
  });

  const retailer = accAlice.contract(backend, exchange.getInfo());

  await retailer.safeApis.Retailer.buySLBs(10);

  const price = (await retailer.v.Main.price())[1];
  expect(stdlib.bigNumberToNumber(price)).toBe(40);
});

test("can sell SLBs to the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB("artifacts/contracts/Bond.sol/SLB_Bond.json");
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 20,
    initTokens: 200,
  });

  const mintAlice = await bond.connect(accAlice.networkAccount).mintBond(10);
  await mintAlice.wait();
  const retailer = accAlice.contract(backend, exchange.getInfo());

  await retailer.safeApis.Retailer.sellSLBs(10);
  const price = (await retailer.v.Main.price())[1];
  expect(stdlib.bigNumberToNumber(price)).toBe(4);
});
