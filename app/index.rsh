'reach 0.1';
// 'use strict';

const SLB = {
    customBalance: Fun([Address], UInt)
}

const InitAssets = Object({
    initSlbs: UInt,
    initTokens: UInt,
});

export const main = Reach.App(() => {
    const Creator = Participant('Creator', {
        slbToken: Token,
        slbContract: Contract,
        launched: Fun([Contract], Null),
        startExchange: Fun([Contract], InitAssets)
    });
    const Retailer = API('Retailer', {
        buySLBs: Fun([UInt], Bool),
        sellSLBs: Fun([UInt], Bool),
        // depositSLBs: Fun([UInt], Bool),
        // depositTokens: Fun([UInt], Bool),
    });
    init();

    Creator.only(() => {
        const slbToken = declassify(interact.slbToken);
        const slbAddress = declassify(interact.slbContract);
    });
    Creator.publish(slbToken, slbAddress);

    commit();

    Creator.only(() => {
        const {
            initSlbs,
            initTokens,
        } = declassify(interact.startExchange(getContract()));
    });
    Creator
        .publish(initSlbs, initTokens)
        .pay([initTokens, [initSlbs, slbToken]])
        .check(() => {
            check(initSlbs > 0);
            check(initTokens > 0);
        });

    // Initialize remote SLB Contract
    const slbContract = remote(slbAddress, SLB);

    Creator.interact.launched(getContract());

    // const deposits = new Map(Object({
    //     slbs: UInt,
    //     tokens: UInt
    // }));

    const [] = parallelReduce([])
        .invariant(balance() > 0)
        .invariant(balance(slbToken) > 0)
        .invariant(balance(slbToken) * balance() <= initSlbs * initTokens, "Invariant has to hold")
        .while(true)
        .paySpec([slbToken])
        .api_(Retailer.buySLBs,
            (volume) => {
                check(volume > 0, 'Must buy at least 1 SLB');
                check(volume < balance(slbToken), "Cannot buy more SLBs than currently in the pool");

                const newSlbs = balance(slbToken) - volume;
                const newTokens = muldiv(balance(), balance(slbToken), newSlbs);

                check(newTokens > balance(), "SLBs cannot be free");
                const owedTokens = newTokens - balance();

                return [
                    [owedTokens, [0, slbToken]], (apiReturn) => {
                        transfer(volume, slbToken).to(this);

                        apiReturn(true);
                        return [];
                    }
                ]
            }
        )
        .api_(Retailer.sellSLBs,
            (volume) => {
                check(volume > 0, 'Must sell at least 1 SLB');

                const oldSlbs = balance(slbToken) - volume;
                const newTokens = muldiv(balance(), oldSlbs, balance(slbToken));
                check(newTokens > 0, "Cannot sell more SLBs than currently can be bought");
                check(newTokens < balance(), "SLBs cannot be free");

                const owedTokens = balance() - newTokens;

                return [
                    [0, [volume, slbToken]], (apiReturn) => {
                        transfer(owedTokens).to(this);

                        apiReturn(true);
                        return [];
                    }
                ]
            }
        );
    // .api(Retailer.depositSLBs,
    //     (volume) => {
    //         assume(volume > 0, 'Must deposit at least 1 SLB');
    //     },
    //     (_) => 0,
    //     (volume, apiReturn) => {
    //         require(volume > 0, 'Must deposit at least 1 SLB');

    //         const _ = ctcSol.transferFrom(this, getAddress(), volume);

    //         // Add deposit to the record
    //         const {
    //             slbs,
    //             tokens
    //         } = fromSome(deposits[this], {
    //             slbs: 0,
    //             tokens: 0
    //         });
    //         deposits[this] = { 
    //             slbs: slbs + volume,
    //             tokens
    //         };

    //         apiReturn(true);
    //         return slbsHeld + volume;
    //     }
    // )

    // .api(Retailer.depositTokens,
    //     (volume) => {
    //         assume(volume > 0, 'Must deposit at least 1 SLB');
    //     },
    //     (_) => 0,
    //     (volume, apiReturn) => {
    //         require(volume > 0, 'Must deposit at least 1 SLB');

    //         const _ = ctcSol.transferFrom(this, getAddress(), volume);

    //         // Add deposit to the record
    //         const {
    //             slbs,
    //             tokens
    //         } = fromSome(deposits[this], {
    //             slbs: 0,
    //             tokens: 0
    //         });
    //         deposits[this] = {
    //             slbs: slbs + volume,
    //             tokens
    //         };

    //         // Recompute invariant
    //         apiReturn(true);
    //         return slbsHeld;
    //     }
    // );

    commit();
    exit();
});