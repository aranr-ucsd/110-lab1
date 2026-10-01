export type Weather = "SUNNY" | "HOT AND DRY" | "CLOUDY" | "THUNDERSTORMS";
export type Ingredient = "cups" | "lemons" | "sugar" | "ice";
export const INGREDIENTS: Ingredient[] = ["cups", "lemons", "sugar", "ice"];


export const LABELS: Record<Ingredient, string> = {
  cups: "cups",
  lemons: "lemons",
  sugar: "scoops of sugar",
  ice: "ice cubes",
};


export type Supplies = Record<Ingredient, number>;

export interface DayOrder {
  glasses: number;       
  signs: number;         
  pricePerGlass: number; 
}

export interface DayResult {
  day: number;
  weather: Weather;
  glassesMade: number;
  demand: number;       
  glassesSold: number;
  missedSales: number;  
  signsBought: number;
  pricePerGlass: number;
  income: number;       
  expenses: number;     
  profit: number;       
  assets: number;       
  iceMelted: number;    
}



export const RECIPE: Supplies = { cups: 1, lemons: 2, sugar: 3, ice: 4 };


const FAIR_PRICE = 30;

function emptySupplies(): Supplies {
  return { cups: 0, lemons: 0, sugar: 0, ice: 0 };
}

export class LemonadeStand {
  private assets = 500; 
  private day = 0;
  private readonly signCost = 15;
  private weather: Weather = "SUNNY";
  private inventory: Supplies = emptySupplies();
  private spentToday = 0;

  
  private prices: Supplies = { cups: 2, lemons: 2, sugar: 1, ice: 1 };

  constructor(private readonly name: string = "Stand 1") {}

  get currentAssets(): number {
    return this.assets;
  }

  get currentDay(): number {
    return this.day;
  }

  get costPerSign(): number {
    return this.signCost;
  }

  get todaysWeather(): Weather {
    return this.weather;
  }

  
  get currentInventory(): Supplies {
    return { ...this.inventory };
  }

  get currentPrices(): Supplies {
    return { ...this.prices };
  }

  get recipe(): Supplies {
    return { ...RECIPE };
  }

  
  get costPerGlass(): number {
    return INGREDIENTS.reduce((sum, item) => sum + this.prices[item] * RECIPE[item], 0);
  }

  
  get glassesPossible(): number {
    return Math.min(...INGREDIENTS.map((item) => Math.floor(this.inventory[item] / RECIPE[item])));
  }

  get isBroke(): boolean {
    
    if (this.glassesPossible > 0) return false;
    const costToMakeOne = INGREDIENTS.reduce((sum, item) => {
      const missing = Math.max(0, RECIPE[item] - this.inventory[item]);
      return sum + missing * this.prices[item];
    }, 0);
    return this.assets < costToMakeOne;
  }

  
  startDay(): Weather {
    this.day++;
    this.spentToday = 0;

    
    if (this.day === 3) this.prices.lemons = 3;
    if (this.day === 7) {
      this.prices.lemons = 4;
      this.prices.sugar = 2;
    }

    const roll = Math.random();
    if (this.day < 3) {
      this.weather = "SUNNY"; 
    } else if (roll < 0.6) {
      this.weather = "SUNNY";
    } else if (roll < 0.8) {
      this.weather = "CLOUDY";
    } else {
      this.weather = "HOT AND DRY";
    }

    return this.weather;
  }

  costOf(purchase: Supplies): number {
    return INGREDIENTS.reduce((sum, item) => sum + purchase[item] * this.prices[item], 0);
  }

  
  validatePurchase(purchase: Supplies): string | null {
    for (const item of INGREDIENTS) {
      const amount = purchase[item];
      if (!Number.isInteger(amount) || amount < 0 || amount > 1000) {
        return `Amount of ${item} must be a whole number from 0 to 1000.`;
      }
    }
    const cost = this.costOf(purchase);
    if (cost > this.assets) {
      return `That costs ${formatMoney(cost)} but you only have ${formatMoney(this.assets)}.`;
    }
    return null;
  }

  buySupplies(purchase: Supplies): void {
    const error = this.validatePurchase(purchase);
    if (error) throw new Error(error);

    const cost = this.costOf(purchase);
    this.assets -= cost;
    this.spentToday += cost;
    for (const item of INGREDIENTS) {
      this.inventory[item] += purchase[item];
    }
  }

  
  validateOrder(order: DayOrder): string | null {
    const { glasses, signs, pricePerGlass } = order;

    if (!Number.isInteger(glasses) || glasses < 0) {
      return "Glasses must be a whole number of 0 or more.";
    }
    if (glasses > this.glassesPossible) {
      return `You only have enough supplies for ${this.glassesPossible} glasses.`;
    }
    if (!Number.isInteger(signs) || signs < 0 || signs > 50) {
      return "Signs must be a whole number from 0 to 50.";
    }
    if (!Number.isInteger(pricePerGlass) || pricePerGlass < 0 || pricePerGlass > 100) {
      return "Price must be a whole number of cents from 0 to 100.";
    }
    const signTotal = signs * this.signCost;
    if (signTotal > this.assets) {
      return `Signs cost ${formatMoney(signTotal)} but you only have ${formatMoney(this.assets)}.`;
    }
    return null;
  }

  
  runDay(order: DayOrder): DayResult {
    const error = this.validateOrder(order);
    if (error) throw new Error(error);

    const { glasses, signs, pricePerGlass } = order;

    
    for (const item of INGREDIENTS) {
      this.inventory[item] -= glasses * RECIPE[item];
    }

    const signTotal = signs * this.signCost;
    this.assets -= signTotal;
    const expenses = this.spentToday + signTotal;

    
    if (this.weather === "CLOUDY" && Math.random() < 0.25) {
      this.weather = "THUNDERSTORMS";
    }

    const demand = this.customerDemand(pricePerGlass, signs);
    const glassesSold = Math.min(glasses, demand);
    const income = glassesSold * pricePerGlass;
    this.assets += income;

    
    const iceMelted = this.inventory.ice;
    this.inventory.ice = 0;

    return {
      day: this.day,
      weather: this.weather,
      glassesMade: glasses,
      demand,
      glassesSold,
      missedSales: demand - glassesSold,
      signsBought: signs,
      pricePerGlass,
      income,
      expenses,
      profit: income - expenses,
      assets: this.assets,
      iceMelted,
    };
  }

  
  
  private customerDemand(price: number, signs: number): number {
    if (this.weather === "THUNDERSTORMS") return 0;

    let base: number;
    if (price <= 0) {
      base = 54; 
    } else if (price < FAIR_PRICE) {
      base = ((FAIR_PRICE - price) / FAIR_PRICE) * 0.8 * 30 + 30;
    } else {
      base = (FAIR_PRICE * FAIR_PRICE * 30) / (price * price);
    }

    
    const signBoost = 1 - Math.exp(-signs * 0.5);

    let weatherFactor = 1;
    if (this.weather === "HOT AND DRY") weatherFactor = 2;
    if (this.weather === "CLOUDY") weatherFactor = 0.6;

    return Math.floor(base * (1 + signBoost) * weatherFactor);
  }

  toString(): string {
    return `${this.name} | Day ${this.day} | Assets ${formatMoney(this.assets)}`;
  }
}

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}