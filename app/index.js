import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";
import bond_json from "contracts/artifacts/contracts/SLB_Bond.sol/SLB_Bond.json" assert { type: "json" };
import ganache from "ganache";

const stdlib = loadStdlib();

if (stdlib.connector === "ALGO") {
  process.exit(0);
}
const { ethers } = stdlib;

const ganacheOptions = { miner: { blockTime: 0 } };
const ganacheProvider = new ethers.providers.Web3Provider(
  ganache.provider(ganacheOptions)
);
stdlib.setProvider(ganacheProvider);
const faucet = ganacheProvider.getSigner();
stdlib.setFaucet(stdlib.connectAccount(faucet));

async function createTestAccounts() {
  const startingBalance = stdlib.parseCurrency(10);
  const [accAlice, accBob, accCreator] = await stdlib.newTestAccounts(
    3,
    startingBalance
  );

  accAlice.setDebugLabel("Alice");
  accBob.setDebugLabel("Bob");
  accCreator.setDebugLabel("Creator");

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
  const bond = await factory.deploy();
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
      2,
      10,
      5,
      100,
      nowUnix + 50,
      nowUnix + 100,
      nowUnix + 150
    );
  await newBond.wait();

  return { bond, owner: acc2, verifier: acc3 };
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

async function main() {
  const [accAlice, accCreator] = await createTestAccounts();
  const { bond } = await deploySLB();

  const mint = await bond.connect(accCreator.networkAccount).mintBond(100);
  await mint.wait();

  const stableCoin = await deployStableCoin(accCreator);

  console.log("HERE");

  const exchange = await deployExchange(accCreator, bond, stableCoin, {
    initSlbs: 100,
    initTokens: 2000,
  });
  console.log("THERE");

  const retailer = accAlice.contract(backend, exchange.getInfo());
  await stableCoin.mint(accAlice, 2000);

  await retailer.apis.Retailer.buySLBs(1);
}

await main();
