import * as readline from "node:readline";
import process, { stdin as input, stdout as output } from "node:process";
import { LemonadeStand, formatMoney, DayOrder, Supplies, INGREDIENTS, LABELS } from "./lemonadeStand";

const MAX_DAYS = 12;

const rl = readline.createInterface({ input, output });
const lines = rl[Symbol.asyncIterator]();

async function ask(question: string): Promise<string> {
  output.write(question);
  const next = await lines.next();
  if (next.done) {
    console.log("\nNo more input. Goodbye!");
    process.exit(0);
  }
  return next.value;
}

async function askNumber(question: string): Promise<number> {
  while (true) {
    const answer = (await ask(question)).trim();
    if (answer === "") return 0; 
    const value = Number(answer);
    if (Number.isInteger(value)) return value;
    console.log("Please type a whole number.");
  }
}


function demandBar(demand: number): string {
  const blocks = Math.min(40, Math.ceil(demand / 5));
  return "#".repeat(blocks) + (demand > 200 ? "+" : "");
}

function showInventory(stand: LemonadeStand): void {
  const inv = stand.currentInventory;
  const prices = stand.currentPrices;
  console.log("Supplies            Have   Per glass   Price each");
  const recipe = stand.recipe;
  for (const item of INGREDIENTS) {
    console.log(`  ${LABELS[item].padEnd(17)} ${String(inv[item]).padStart(4)}   ${String(recipe[item]).padStart(9)}   ${prices[item]} cents`);
  }
  console.log(`One glass of lemonade costs ${stand.costPerGlass} cents in ingredients.`);
  console.log(`You can make ${stand.glassesPossible} glasses right now.`);
}

async function shop(stand: LemonadeStand): Promise<void> {
  console.log("\n--- SUPPLY STORE --- (press Enter to buy none)");
  while (true) {
    const purchase: Supplies = { cups: 0, lemons: 0, sugar: 0, ice: 0 };
    for (const item of INGREDIENTS) {
      purchase[item] = await askNumber(`How many ${LABELS[item]} do you want to buy? `);
    }

    const error = stand.validatePurchase(purchase);
    if (error) {
      console.log(`\n${error} Try again.\n`);
      continue;
    }

    stand.buySupplies(purchase);
    console.log(`\nYou spent ${formatMoney(stand.costOf(purchase))}. Assets: ${formatMoney(stand.currentAssets)}`);
    console.log(`You can now make ${stand.glassesPossible} glasses.\n`);
    return;
  }
}

async function getOrder(stand: LemonadeStand): Promise<DayOrder> {
  while (true) {
    const glasses = await askNumber(`How many glasses do you want to make (max ${stand.glassesPossible})? `);
    const signs = await askNumber(`How many advertising signs (${stand.costPerSign} cents each)? `);
    const pricePerGlass = await askNumber("What price (in cents) do you wish to charge? ");

    const order = { glasses, signs, pricePerGlass };
    const error = stand.validateOrder(order);
    if (!error) return order;
    console.log(`\n${error} Try again.\n`);
  }
}

async function main(): Promise<void> {
  console.log("=================================");
  console.log("         LEMONADE STAND");
  console.log("=================================\n");
  console.log("You run a lemonade stand for the summer.");
  console.log("Buy cups, lemons, sugar and ice. Each glass needs a set amount of each.");
  console.log("Cups, lemons and sugar keep overnight, but leftover ice melts.");
  const stand = new LemonadeStand();
  console.log(`You start with ${formatMoney(stand.currentAssets)}.\n`);

  while (stand.currentDay < MAX_DAYS) {
    const weather = stand.startDay();

    if (stand.isBroke) {
      console.log("You can't afford enough supplies to make lemonade. Game over.");
      break;
    }

    console.log("---------------------------------");
    console.log(`Day ${stand.currentDay}   Weather: ${weather}`);
    console.log(`Assets: ${formatMoney(stand.currentAssets)}`);
    console.log("---------------------------------");
    showInventory(stand);

    await shop(stand);
    const order = await getOrder(stand);
    const result = stand.runDay(order);

    console.log("");
    if (result.weather === "THUNDERSTORMS") {
      console.log("A thunderstorm rolled in! Everyone went home.");
    }
    console.log(`Demand:        ${result.demand} customers  ${demandBar(result.demand)}`);
    console.log(`Glasses sold:  ${result.glassesSold} of ${result.glassesMade}`);
    if (result.missedSales > 0) {
      console.log(`You ran out! ${result.missedSales} customers left without lemonade.`);
    } else if (result.glassesMade > result.glassesSold) {
      console.log(`${result.glassesMade - result.glassesSold} glasses went unsold.`);
    }
    if (result.iceMelted > 0) {
      console.log(`${result.iceMelted} leftover ice cubes melted overnight.`);
    }
    console.log(`Income:        ${formatMoney(result.income)}`);
    console.log(`Expenses:      ${formatMoney(result.expenses)}`);
    console.log(`Profit:        ${formatMoney(result.profit)}`);
    console.log(`Assets:        ${formatMoney(result.assets)}\n`);
  }

  console.log(`\nSummer is over. You finished with ${formatMoney(stand.currentAssets)}.`);
  rl.close();
}

main();