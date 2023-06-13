"reach 0.1";
"use strict";

const SLB = {
  hasUnclaimedFunds: Fun([Address], Bool),
  claimAllCoupons: Fun([], Null),
};

const PositiveUInt = Refine(UInt, (x) => x > 0);

const InitAssets = Object({
  initSlbs: PositiveUInt,
  initTokens: PositiveUInt,
});

const DepositedAssets = Object({
  depositedSlbs: PositiveUInt,
  depositedTokens: PositiveUInt,
});

export const main = Reach.App(() => {
  const Creator = Participant("Creator", {
    slbToken: Token,
    stableToken: Token,
    slbContract: Contract,
    launched: Fun([Contract], Null),
    startExchange: Fun([Contract], InitAssets),
  });
  const Retailer = API("Retailer", {
    buySLBs: Fun([PositiveUInt], Bool),
    sellSLBs: Fun([PositiveUInt], UInt),
    deposit: Fun([PositiveUInt], Bool),
    withdraw: Fun([], Bool),
  });
  const V = View("Main", {
    price: UInt,
    deposits: Fun([Address], DepositedAssets),
  });
  init();

  Creator.only(() => {
    const slbToken = declassify(interact.slbToken);
    const stableToken = declassify(interact.stableToken);
    const slbAddress = declassify(interact.slbContract);
    check(slbToken != stableToken);
  });
  Creator.publish(slbToken, slbAddress, stableToken);

  commit();

  Creator.only(() => {
    const { initSlbs, initTokens } = declassify(
      interact.startExchange(getContract())
    );
  });
  Creator.publish(initSlbs, initTokens)
    .pay([0, [initSlbs, slbToken], [initTokens, stableToken]])
    .check(() => {
      check(initSlbs > 0);
      check(initTokens > 0);
    });

  // Initialize remote SLB Contract
  const slbContract = remote(slbAddress, SLB);

  Creator.interact.launched(getContract());

  const deposits = new Map(DepositedAssets);
  deposits[Creator] = { depositedTokens: initTokens, depositedSlbs: initSlbs };

  const [stableTokenBalance, slbTokenBalance] = parallelReduce([
    initTokens,
    initSlbs,
  ])
    .define(() => {
      V.price.set(stableTokenBalance / slbTokenBalance);
      V.deposits.set((address) =>
        fromSome(deposits[address], { depositedTokens: 0, depositedSlbs: 0 })
      );
    })
    .invariant(stableTokenBalance > 0)
    .invariant(slbTokenBalance > 0)
    .invariant(stableTokenBalance == balance(stableToken))
    .invariant(slbTokenBalance == balance(slbToken))
    .while(true)
    .paySpec([slbToken, stableToken])
    .api_(Retailer.buySLBs, (volume) => {
      check(volume > 0, "Must buy at least 1 SLB");
      check(
        volume < slbTokenBalance,
        "Cannot buy more SLBs than currently in the pool"
      );

      const newSlbs = slbTokenBalance - volume;
      const newTokens = muldiv(stableTokenBalance, slbTokenBalance, newSlbs);

      check(newTokens > stableTokenBalance, "SLBs cannot be free");
      const owedTokens = newTokens - stableTokenBalance;

      return [
        [0, [0, slbToken], [owedTokens, stableToken]],
        (apiReturn) => {
          if (slbContract.hasUnclaimedFunds(getAddress())) {
            const _ = slbContract.claimAllCoupons.withBill()();
          }
          transfer(volume, slbToken).to(this);

          apiReturn(true);
          return [stableTokenBalance + owedTokens, slbTokenBalance - volume];
        },
      ];
    })
    .api_(Retailer.sellSLBs, (volume) => {
      check(volume > 0, "Must sell at least 1 SLB");

      const newSlbs = slbTokenBalance + volume;
      const newTokens = muldiv(stableTokenBalance, slbTokenBalance, newSlbs);
      check(
        newTokens > 0,
        "Cannot sell more SLBs than currently can be bought"
      );
      check(newTokens < stableTokenBalance, "SLBs cannot be free");

      const owedTokens = stableTokenBalance - newTokens;

      return [
        [0, [volume, slbToken], [0, stableToken]],
        (apiReturn) => {
          transfer(owedTokens, stableToken).to(this);

          apiReturn(owedTokens);
          return [stableTokenBalance - owedTokens, slbTokenBalance + volume];
        },
      ];
    })
    .api_(Retailer.deposit, (slbsToDeposit) => {
      check(slbsToDeposit > 0, "Must deposit at least 1 SLB");

      // Ensures that the *PRICE* of the SLB remains constant - AMM invariant increases
      const tokensToDeposit = muldiv(
        slbsToDeposit,
        stableTokenBalance,
        slbTokenBalance
      );
      check(tokensToDeposit > 0, "Must deposit at least 1 token");

      return [
        [0, [slbsToDeposit, slbToken], [tokensToDeposit, stableToken]],
        (apiReturn) => {
          const { depositedTokens, depositedSlbs } = fromSome(deposits[this], {
            depositedTokens: 0,
            depositedSlbs: 0,
          });
          deposits[this] = {
            depositedTokens: depositedTokens + tokensToDeposit,
            depositedSlbs: depositedSlbs + slbsToDeposit,
          };
          apiReturn(true);
          return [
            stableTokenBalance + tokensToDeposit,
            slbTokenBalance + slbsToDeposit,
          ];
        },
      ];
    })
    .api_(Retailer.withdraw, () => {
      const { depositedTokens, depositedSlbs } = fromSome(deposits[this], {
        depositedTokens: 0,
        depositedSlbs: 0,
      });

      check(
        depositedTokens * depositedSlbs < slbTokenBalance * stableTokenBalance,
        "Not enough liquidity to withdraw"
      );
      check(depositedSlbs > 0);
      check(depositedTokens > 0);

      return [
        (apiReturn) => {
          if (slbContract.hasUnclaimedFunds(getAddress())) {
            const _ = slbContract.claimAllCoupons.withBill()();
          }
          require(depositedTokens * depositedSlbs <
            slbTokenBalance *
              stableTokenBalance, "Not enough liquidity to withdraw");

          const depositInvariant = depositedTokens * depositedSlbs;

          // Ensures that the *PRICE* of the SLB remains constant - AMM invariant decreases
          const slbsToReturn = sqrt(
            muldiv(depositInvariant, slbTokenBalance, stableTokenBalance)
          );
          const tokensToReturn = sqrt(
            muldiv(depositInvariant, stableTokenBalance, slbTokenBalance)
          );
          delete deposits[this];

          if (balance() > 0) {
            const networkTokensToReturn = muldiv(
              sqrt(depositInvariant),
              balance(),
              sqrt(slbTokenBalance * stableTokenBalance)
            );
            enforce(networkTokensToReturn < balance());
            transfer(networkTokensToReturn).to(this);
          }

          enforce(slbsToReturn < slbTokenBalance);
          transfer(slbsToReturn, slbToken).to(this);

          enforce(tokensToReturn < stableTokenBalance);
          transfer(tokensToReturn, stableToken).to(this);
          apiReturn(true);
          return [
            stableTokenBalance - tokensToReturn,
            slbTokenBalance - slbsToReturn,
          ];
        },
      ];
    });

  commit();
  exit();
});
