interface Bond {
  id?: string;
  description: string;
  address: string;
  kpis: string[];
  active_date: Date;
  maturity_date: Date;
  current_period: number;
  periods: number;
  exchange?: string;
}