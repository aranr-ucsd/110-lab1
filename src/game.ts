import * as readline from "node:readline";
import process, { stdin as input, stdout as output } from "node:process";
import { LemonadeStand, formatMoney, DayOrder } from "./lemonadeStand";

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
    const value = Number(answer);
    if (answer !== "" && Number.isInteger(value)) return value;
    console.log("Please type a whole number.");
  }
}

// Simple text bar so you can see demand at a glance. Each # is 5 customers.
function demandBar(demand: number): string {
  const blocks = Math.min(40, Math.ceil(demand / 5));
  return "#".repeat(blocks) + (demand > 200 ? "+" : "");
}

async function getOrder(stand: LemonadeStand): Promise<DayOrder> {
  while (true) {
    const glasses = await askNumber("How many glasses of lemonade do you wish to make? ");
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
  console.log("Make lemonade, buy signs, set a price, and try to make money.");
  console.log(`You start with ${formatMoney(200)}.\n`);

  const stand = new LemonadeStand();

  while (stand.currentDay < MAX_DAYS) {
    const weather = stand.startDay();

    if (stand.isBroke) {
      console.log("You don't have enough money to make lemonade. Game over.");
      break;
    }

    console.log("---------------------------------");
    console.log(`Day ${stand.currentDay}   Weather: ${weather}`);
    console.log(`Assets: ${formatMoney(stand.currentAssets)}`);
    console.log(`Cost of lemonade is ${stand.costPerGlass} cents per glass.`);
    console.log("---------------------------------");

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
    console.log(`Income:        ${formatMoney(result.income)}`);
    console.log(`Expenses:      ${formatMoney(result.expenses)}`);
    console.log(`Profit:        ${formatMoney(result.profit)}`);
    console.log(`Assets:        ${formatMoney(result.assets)}\n`);
  }

  console.log(`\nSummer is over. You finished with ${formatMoney(stand.currentAssets)}.`);
  rl.close();
}

main();