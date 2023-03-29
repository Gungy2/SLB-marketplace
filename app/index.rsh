'reach 0.1';
'use strict';

const ERC21 = {
  transferFrom: Fun([Address, Address, UInt], Bool),
  balanceOf: Fun([Address], UInt),
}

export const main = Reach.App(() => {
    const Creator = Participant('Creator', {
      slbContractAddress: Contract,
      launched: Fun([Contract], Null),
    });
    const Retailer = API('Retailer', {
      buySLBs: Fun([UInt], Bool),
      sellSLBs: Fun([UInt], Bool),
      hello: Fun([], Bool),
    });
    init();

    Creator.only(() => {
        const slbAddress = declassify(interact.slbContractAddress);
    });
    Creator.publish(slbAddress);
    Creator.interact.launched(getContract());
    const ctcSol = remote(slbAddress, ERC21);

    const [] = parallelReduce([])
      .invariant(balance() >= 0)
      .while(true)
      .api(Retailer.buySLBs,
        (volume) => {
          assume(volume > 0, 'Must buy at least 1 SLB');
        },
        (_) => 0,
        (volume, apiReturn) => {
          require(volume > 0, 'Must buy at least 1 SLB');
          const _ = ctcSol.transferFrom(getAddress(), this, volume);

          apiReturn(true);
          return [];
        }
      )
      .api(Retailer.sellSLBs,
        (volume) => {
          assume(volume > 0, 'Must sell at least 1 SLB');
        },
        (_) => 0,
        (volume, apiReturn) => {
          require(volume > 0, 'Must sell at least 1 SLB');
          const _ = ctcSol.transferFrom(this, getAddress(), volume);

          apiReturn(true);
          return [];
        }
      )
      .api(Retailer.hello,
        () => {},
        () => 0,
        (apiReturn) => {
          // require(volume > 0, 'No rewards left');
          // const _ = ctcSol.transferFrom(getAddress(), this, volume);
          apiReturn(false);
          // Update global state
          return [];
        }
      );
    commit();
    exit();
});
