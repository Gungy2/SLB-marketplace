"reach 0.1";
"use strict";

const SLB = {
  getBalance: Fun([], UInt),
};

const InitAssets = Object({
  initSlbs: UInt,
  initTokens: UInt,
});

export const main = Reach.App(() => {
  const Creator = Participant("Creator", {
    slbToken: Token,
    slbContract: Contract,
    launched: Fun([Contract], Null),
    startExchange: Fun([Contract], InitAssets),
  });
  const Retailer = API("Retailer", {
    buySLBs: Fun([UInt], Bool),
    sellSLBs: Fun([UInt], Bool),
    customGetBalance: Fun([], UInt),
    deposit: Fun([UInt], Bool),
    withdraw: Fun([], Bool),
  });
  const V = View("Main", {
    price: UInt,
    deposits: Fun([Address], UInt),
  });
  init();

  Creator.only(() => {
    const slbToken = declassify(interact.slbToken);
    const slbAddress = declassify(interact.slbContract);
  });
  Creator.publish(slbToken, slbAddress);

  commit();

  Creator.only(() => {
    const { initSlbs, initTokens } = declassify(
      interact.startExchange(getContract())
    );
  });
  Creator.publish(initSlbs, initTokens)
    .pay([initTokens, [initSlbs, slbToken]])
    .check(() => {
      check(initSlbs > 0);
      check(initTokens > 0);
    });

  // Initialize remote SLB Contract
  const slbContract = remote(slbAddress, SLB);

  Creator.interact.launched(getContract());

  const deposits = new Map(UInt);
  deposits[Creator] = initTokens;

  const [] = parallelReduce([])
    .define(() => {
      V.price.set(balance() / balance(slbToken));
      V.deposits.set((address) => fromSome(deposits[address], 0));
    })
    .invariant(balance() > 0)
    .invariant(balance(slbToken) > 0)
    // .invariant(
    //   balance(slbToken) * balance() <= initSlbs * initTokens,
    //   "Invariant has to hold"
    // )
    .while(true)
    .paySpec([slbToken])
    .api_(Retailer.buySLBs, (volume) => {
      check(volume > 0, "Must buy at least 1 SLB");
      check(
        volume < balance(slbToken),
        "Cannot buy more SLBs than currently in the pool"
      );

      const newSlbs = balance(slbToken) - volume;
      const newTokens = muldiv(balance(), balance(slbToken), newSlbs);

      check(newTokens > balance(), "SLBs cannot be free");
      const owedTokens = newTokens - balance();

      return [
        [owedTokens, [0, slbToken]],
        (apiReturn) => {
          transfer(volume, slbToken).to(this);

          apiReturn(true);
          return [];
        },
      ];
    })
    .api_(Retailer.sellSLBs, (volume) => {
      check(volume > 0, "Must sell at least 1 SLB");

      const oldSlbs = balance(slbToken) - volume;
      const newTokens = muldiv(balance(), oldSlbs, balance(slbToken));
      check(
        newTokens > 0,
        "Cannot sell more SLBs than currently can be bought"
      );
      check(newTokens < balance(), "SLBs cannot be free");

      const owedTokens = balance() - newTokens;

      return [
        [0, [volume, slbToken]],
        (apiReturn) => {
          transfer(owedTokens).to(this);

          apiReturn(true);
          return [];
        },
      ];
    })
    .api_(Retailer.customGetBalance, () => {
      return [
        [0, [0, slbToken]],
        (apiReturn) => {
          apiReturn(slbContract.getBalance());
          return [];
        },
      ];
    })
    .api_(Retailer.deposit, (slbsToDeposit) => {
      check(slbsToDeposit > 0, "Must deposit at least 1 SLB");
      const tokensToDeposit = muldiv(
        slbsToDeposit,
        balance(),
        balance(slbToken)
      );

      return [
        [tokensToDeposit, [slbsToDeposit, slbToken]],
        (apiReturn) => {
          deposits[this] = fromSome(deposits[this], 0) + tokensToDeposit;
          apiReturn(true);
          return [];
        },
      ];
    })
    .api_(Retailer.withdraw, () => {
      const depositedTokens = fromSome(deposits[this], 0);
      check(
        depositedTokens < balance(),
        "You cannot withdraw due to lack of funds (tokens)!"
      );
      const depositedSlbs = muldiv(
        depositedTokens,
        balance(slbToken),
        balance()
      );
      check(
        depositedSlbs < balance(slbToken),
        "You cannot withdraw due to lack of funds (SLBs)!"
      );

      return [
        (apiReturn) => {
          deposits[this] = 0;
          transfer(depositedSlbs, slbToken).to(this);
          transfer(depositedTokens).to(this);
          apiReturn(true);
          return [];
        },
      ];
    });

  commit();
  exit();
});
