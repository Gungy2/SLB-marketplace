interface Bond {
  id?: string;
  description: string;
  address: string;
  kpis: string[];
  active_date: Date;
  maturity_date: Date;
  current_period: number;
  periods: number;
}

interface Exchange {
  id?: string,
  address: string,
  expand: {
    bond: Bond,
    stable_coin: StableCoin,
  },
  amm: boolean,
}

interface StableCoin {
  id?: string,
  name: string,
  symbol: string,
  address: string,
}