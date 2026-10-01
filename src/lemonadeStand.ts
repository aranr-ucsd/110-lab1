export type Weather = "SUNNY" | "HOT AND DRY" | "CLOUDY" | "THUNDERSTORMS";

export interface DayOrder {
  glasses: number;      
  signs: number;        
  pricePerGlass: number; 
}

export interface DayResult {
  day: number;
  weather: Weather;
  glassesMade: number;
  glassesSold: number;
  signsBought: number;
  pricePerGlass: number;
  income: number;   
  expenses: number; 
  profit: number;   
  assets: number;   
}

export class LemonadeStand {
  
  private assets = 200;        
  private day = 0;
  private glassCost = 2;       
  private readonly signCost = 15;
  private weather: Weather = "SUNNY";

  constructor(private readonly name: string = "Stand 1") {}

  get currentAssets(): number {
    return this.assets;
  }

  get currentDay(): number {
    return this.day;
  }

  get costPerGlass(): number {
    return this.glassCost;
  }

  get costPerSign(): number {
    return this.signCost;
  }

  get todaysWeather(): Weather {
    return this.weather;
  }

  get isBroke(): boolean {
    
    return this.assets < this.glassCost;
  }

  
  startDay(): Weather {
    this.day++;

    
    if (this.day > 2) this.glassCost = 4;
    if (this.day > 6) this.glassCost = 5;

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

  
  validateOrder(order: DayOrder): string | null {
    const { glasses, signs, pricePerGlass } = order;

    if (!Number.isInteger(glasses) || glasses < 0 || glasses > 1000) {
      return "Glasses must be a whole number from 0 to 1000.";
    }
    if (!Number.isInteger(signs) || signs < 0 || signs > 50) {
      return "Signs must be a whole number from 0 to 50.";
    }
    if (!Number.isInteger(pricePerGlass) || pricePerGlass < 0 || pricePerGlass > 100) {
      return "Price must be a whole number of cents from 0 to 100.";
    }

    const cost = glasses * this.glassCost + signs * this.signCost;
    if (cost > this.assets) {
      return `That costs ${formatMoney(cost)} but you only have ${formatMoney(this.assets)}.`;
    }
    return null;
  }

  
  runDay(order: DayOrder): DayResult {
    const error = this.validateOrder(order);
    if (error) throw new Error(error);

    const { glasses, signs, pricePerGlass } = order;
    const expenses = glasses * this.glassCost + signs * this.signCost;

    
    if (this.weather === "CLOUDY" && Math.random() < 0.25) {
      this.weather = "THUNDERSTORMS";
    }

    const demand = this.customerDemand(pricePerGlass, signs);
    const glassesSold = Math.min(glasses, demand);
    const income = glassesSold * pricePerGlass;
    const profit = income - expenses;

    this.assets += profit;

    return {
      day: this.day,
      weather: this.weather,
      glassesMade: glasses,
      glassesSold,
      signsBought: signs,
      pricePerGlass,
      income,
      expenses,
      profit,
      assets: this.assets,
    };
  }

  
  
  private customerDemand(price: number, signs: number): number {
    if (this.weather === "THUNDERSTORMS") return 0;

    let base: number;
    if (price <= 0) {
      base = 54; 
    } else if (price < 10) {
      base = ((10 - price) / 10) * 0.8 * 30 + 30;
    } else {
      base = (10 * 10 * 30) / (price * price);
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