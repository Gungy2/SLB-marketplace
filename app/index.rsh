'reach 0.1';
'use strict';

const ERC21 = {
    transferFrom: Fun([Address, Address, UInt], Bool),
    balanceOf: Fun([Address], UInt),
}

const InitAssets = Object({
    initSlbs: UInt,
    initTokens: UInt,
});

export const main = Reach.App(() => {
    const Creator = Participant('Creator', {
        slbContractAddress: Contract,
        launched: Fun([Contract], Null),
        startExchange: Fun([Contract], InitAssets)
    });
    const Retailer = API('Retailer', {
        buySLBs: Fun([UInt], Bool),
        sellSLBs: Fun([UInt], Bool),
        depositSLBs: Fun([UInt], Bool),
        depositTokens: Fun([UInt], Bool),
        hello: Fun([], Bool)
    });
    init();

    Creator.only(() => {
        const slbContractAddress = declassify(interact.slbContractAddress);
    });
    Creator.publish(slbContractAddress)

    commit();

    Creator.only(() => {
        const {
            initSlbs,
            initTokens,
        } = declassify(interact.startExchange(getContract()));
    });
    Creator
        .publish(initSlbs, initTokens)
        .pay(initTokens)
        .check(() => {
            check(initSlbs > 0);
            check(initTokens > 0);
        });
    Creator.interact.launched(getContract());


    // Transfer initial assets
    const ctcSol = remote(slbContractAddress, ERC21);
    const _ = ctcSol.transferFrom(this, getAddress(), initSlbs);

    const deposits = new Map(Object({
        slbs: UInt,
        tokens: UInt
    }));

    const [inv, slbs_held] = parallelReduce([initSlbs * initTokens, initSlbs])
        .invariant(balance() >= 0)
        .while(true)
        .api(Retailer.buySLBs,
            (volume) => {
                assume(volume > 0, 'Must buy at least 1 SLB');
                assume(volume < slbs_held, 'Cannot buy more SLBs than currently in the pool');
            },
            (volume) => {
                const newSlbs = slbs_held - volume;
                const newTokens = inv / newSlbs;
                const owedTokens = balance() - newTokens;
                return owedTokens;
            },
            (volume, apiReturn) => {
                require(volume > 0, 'Must buy at least 1 SLB');
                require(volume < slbs_held, 'Cannot buy more SLBs than currently in the pool');

                const _ = ctcSol.transferFrom(getAddress(), this, volume);
                const newSlbs = slbs_held - volume;

                apiReturn(true);
                return [initSlbs * balance(), newSlbs];
            }
        )
        .api(Retailer.sellSLBs,
            (volume) => {
                assume(volume > 0, 'Must sell at least 1 SLB');
            },
            (_) => 0,
            (volume, apiReturn) => {
                require(volume > 0, 'Must sell at least 1 SLB');
                const _ = ctcSol.transferFrom(getAddress(), this, volume);

                apiReturn(true);
                return [initSlbs * balance(), slbs_held];
            }
        )
        .api(Retailer.depositSLBs,
            (volume) => {
                assume(volume > 0, 'Must deposit at least 1 SLB');
            },
            (_) => 0,
            (volume, apiReturn) => {
                require(volume > 0, 'Must deposit at least 1 SLB');

                const _ = ctcSol.transferFrom(this, getAddress(), volume);

                // Add deposit to the record
                const {
                    slbs,
                    tokens
                } = fromSome(deposits[this], {
                    slbs: 0,
                    tokens: 0
                });
                deposits[this] = {
                    slbs: slbs + volume,
                    tokens
                };

                apiReturn(true);
                return [initSlbs * balance(), slbs_held + volume];
            }
        )
        .api(Retailer.hello,
            () => {},
            () => 0,
            (apiReturn) => {
                apiReturn(false);
                return [initSlbs * balance(), slbs_held];
            }
        )
        .api(Retailer.depositTokens,
            (volume) => {
                assume(volume > 0, 'Must deposit at least 1 SLB');
            },
            (_) => 0,
            (volume, apiReturn) => {
                require(volume > 0, 'Must deposit at least 1 SLB');

                const _ = ctcSol.transferFrom(this, getAddress(), volume);

                // Add deposit to the record
                const {
                    slbs,
                    tokens
                } = fromSome(deposits[this], {
                    slbs: 0,
                    tokens: 0
                });
                deposits[this] = {
                    slbs: slbs + volume,
                    tokens
                };

                // Recompute invariant
                apiReturn(true);
                return [initSlbs * balance(), slbs_held];
            }
        );

    commit();
    exit();
});