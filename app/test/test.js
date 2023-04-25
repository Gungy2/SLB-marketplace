import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "../build/index.main.mjs";
import { promises as fs } from "fs";
import { test, expect } from "@jest/globals";
import { log } from "console";

const stdlib = loadStdlib("ETH");

const { ethers } = stdlib;
const myGasLimit = 5000000;
const SLB_LOCATION = "artifacts/contracts/Bond.sol/SLB_Bond.json";

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
  const bond = await deploySLB(SLB_LOCATION);
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
  const bond = await deploySLB(SLB_LOCATION);
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 20,
    initTokens: 200,
  });

  const retailer = accAlice.contract(backend, exchange.getInfo());

  await retailer.apis.Retailer.buySLBs(10);
  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(10);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress())
    )
  ).toBe(400);

  const price = (await retailer.v.Main.price())[1];
  expect(stdlib.bigNumberToNumber(price)).toBe(40);
});

test("can sell SLBs to the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB(SLB_LOCATION);
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 20,
    initTokens: 200,
  });

  const mintAlice = await bond.connect(accAlice.networkAccount).mintBond(10);
  await mintAlice.wait();
  const retailer = accAlice.contract(backend, exchange.getInfo());

  await retailer.apis.Retailer.sellSLBs(10);
  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(30);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress())
    )
  ).toBe(133);

  const price = (await retailer.v.Main.price())[1];
  expect(stdlib.bigNumberToNumber(price)).toBe(4);
});

test("can deposit on the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB(SLB_LOCATION);
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 20,
    initTokens: 200,
  });

  const mintAlice = await bond.connect(accAlice.networkAccount).mintBond(10);
  await mintAlice.wait();
  const retailer = accAlice.contract(backend, exchange.getInfo());

  await retailer.apis.Retailer.deposit(10);
  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(30);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress())
    )
  ).toBe(300);
  expect(
    stdlib.bigNumberToNumber(
      await retailer.unsafeViews.Main.deposits(accAlice.getAddress())
    )
  ).toBe(100);
});

test("can withdraw from the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB(SLB_LOCATION);
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const exchange = await deployExchange(accCreator, bond, {
    initSlbs: 20,
    initTokens: 200,
  });

  const mintAlice = await bond.connect(accAlice.networkAccount).mintBond(10);
  await mintAlice.wait();
  const retailer = accAlice.contract(backend, exchange.getInfo());

  await retailer.apis.Retailer.deposit(10);
  console.log(await retailer.apis.Retailer.withdraw());

  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(20);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress())
    )
  ).toBe(200);
  expect(
    stdlib.bigNumberToNumber(
      await retailer.unsafeViews.Main.deposits(accAlice.getAddress())
    )
  ).toBe(0);
});
