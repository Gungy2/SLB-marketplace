import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "../build/index.main.mjs";
import { test, expect } from "@jest/globals";
import bond_json from "contracts/artifacts/contracts/SLB_Bond.sol/SLB_Bond.json";
import ganache from "ganache";

const stdlib = loadStdlib("ETH");

const { ethers } = stdlib;
const myGasLimit = 5000000;

const ganacheOptions = {};
const ganacheProvider = new ethers.providers.Web3Provider(
  ganache.provider(ganacheOptions)
);
stdlib.setProvider(ganacheProvider);
const faucet = ganacheProvider.getSigner();
stdlib.setFaucet(stdlib.connectAccount(faucet));
const provider = await stdlib.getProvider();

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

async function deploySLB() {
  const startingBalance = stdlib.parseCurrency(5);
  const [acc1, acc2, acc3] = await stdlib.newTestAccounts(3, startingBalance);

  const remoteABI = bond_json["abi"];
  const remoteBytecode = bond_json["bytecode"];
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

async function deployExchange(accCreator, bond, stableCoin, init) {
  const exchange = accCreator.contract(backend);
  await stdlib.withDisconnect(() =>
    exchange.p.Creator({
      slbToken: bond.address,
      slbContract: bond.address,
      stableToken: stableCoin.id,
      startExchange: async function (contract) {
        await bond.approve(contract, init.initSlbs);
        return init;
      },
      launched: stdlib.disconnect,
    })
  );
  return exchange;
}

async function deployStableCoin(accCreator) {
  return await stdlib.launchToken(accCreator, "stable coin", "STC");
}

test("can deploy exchange", async () => {
  const [accCreator] = await createTestAccounts();
  const bond = await deploySLB();
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const stableCoin = await deployStableCoin(accCreator);
  const exchange = await deployExchange(accCreator, bond, stableCoin, {
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
      await stdlib.balanceOf(await exchange.getContractAddress(), stableCoin.id)
    )
  ).toBe(40);
});

test("can buy SLBs from the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB();
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const stableCoin = await deployStableCoin(accCreator);
  const exchange = await deployExchange(accCreator, bond, stableCoin, {
    initSlbs: 20,
    initTokens: 200,
  });

  const retailer = accAlice.contract(backend, exchange.getInfo());
  stableCoin.mint(accAlice, 200);

  await retailer.apis.Retailer.buySLBs(10);
  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(10);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress(), stableCoin.id)
    )
  ).toBe(400);

  const price = (await retailer.v.Main.price())[1];
  expect(stdlib.bigNumberToNumber(price)).toBe(40);
});

test("can sell SLBs to the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB();
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const stableCoin = await deployStableCoin(accCreator);
  const exchange = await deployExchange(accCreator, bond, stableCoin, {
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
      await stdlib.balanceOf(await exchange.getContractAddress(), stableCoin.id)
    )
  ).toBe(133);

  const price = (await retailer.v.Main.price())[1];
  expect(stdlib.bigNumberToNumber(price)).toBe(4);
});

test("can deposit on the exchange", async () => {
  const [accAlice, accCreator] = await createTestAccounts();
  const bond = await deploySLB();
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const stableCoin = await deployStableCoin(accCreator);
  const exchange = await deployExchange(accCreator, bond, stableCoin, {
    initSlbs: 20,
    initTokens: 200,
  });

  const mintAlice = await bond.connect(accAlice.networkAccount).mintBond(10);
  await mintAlice.wait();
  const retailer = accAlice.contract(backend, exchange.getInfo());
  stableCoin.mint(accAlice, 200);

  await retailer.apis.Retailer.deposit(10);
  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(30);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress(), stableCoin.id)
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
  const bond = await deploySLB();
  const mint = await bond.connect(accCreator.networkAccount).mintBond(20);
  await mint.wait();

  const stableCoin = await deployStableCoin(accCreator);
  const exchange = await deployExchange(accCreator, bond, stableCoin, {
    initSlbs: 20,
    initTokens: 200,
  });

  const mintAlice = await bond.connect(accAlice.networkAccount).mintBond(10);
  await mintAlice.wait();
  const retailer = accAlice.contract(backend, exchange.getInfo());
  stableCoin.mint(accAlice, 200);

  await retailer.apis.Retailer.deposit(10);
  await retailer.apis.Retailer.withdraw();

  expect(
    stdlib.bigNumberToNumber(
      await bond.balanceOf(exchange.getContractAddress())
    )
  ).toBe(20);
  expect(
    stdlib.bigNumberToNumber(
      await stdlib.balanceOf(await exchange.getContractAddress(), stableCoin.id)
    )
  ).toBe(200);
  expect(
    stdlib.bigNumberToNumber(
      await retailer.unsafeViews.Main.deposits(accAlice.getAddress())
    )
  ).toBe(0);
});
