// Parameters the user provides directly via the setup form.
export interface UserInputParameters {
  total_winnings: number;
  lump_sum_tax: number;       // Percentage for lump sum tax
  annuity_tax: number;        // Percentage for annuity tax
  savings_apr: number;  // Single APR for all investments
  age: number;
  death_age: number;
  years: number;              // Duration of annuity payments
  ml: number;                 // Amount to leave behind (in today's dollars)
  investment_tax_rate: number;// as a percentage
  inflation_rate: number;     // as a percentage
}

// All parameters (a mix of user-provided and calculated) needed for the financial logic.
export interface InitialParameters {
  // User inputs are stored here for reference
  user_inputs: UserInputParameters;
  
  // Calculated values
  start_year: number;
  lump_sum_net: number;         // Net lump sum after tax
  base_annuity_payment: number; // First year's payment for a growing annuity
  annuity_growth_rate: number;  // How much the annuity payment increases each year (e.g., 1.05 for 5%)
  
  // Copied from user inputs for easier access in logic
  investment_tax_rate: number;
  inflation_rate: number;
}

export interface State {
  last_update_date: string; // "YYYY-MM-DD"
  lump_balance: number;
  annual_balance: number;
  years_passed: number;
}

export interface LotteryData {
  initial_parameters: InitialParameters;
  state: State;
}

export interface Rule {
  title: string;
  description: string;
}

export interface Dominant {
  name: string;
  tiers: {
    [key: string]: string;
  };
}

export interface Age {
    name: string;
    description: string;
    worldsEnd?: string;
}

export interface Meaning {
    name: string;
    description: string;
}

export interface Trinket {
    name: string;
    power: string;
    objective: string;
    points: number;
}

export interface DominantCardState {
    assignedTo: string;
    selectedTier: string | null;
}

export interface TrinketState {
    deck: Trinket[];
    playerTrinkets: { [key: string]: Trinket[] };
} 