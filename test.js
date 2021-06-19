const smartweave = require("smartweave");
const Arweave = require("arweave");

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

let src = `export function handle(state, action) {
  const input = action.input;
  const caller = action.caller;
  if (input.function === "transfer") {
    const target = input.target;
    ContractAssert(target, "No target specified.");
    ContractAssert(caller !== target, "Invalid token transfer.");
    const qty = input.qty;
    ContractAssert(qty, "No quantity specified.");
    const balances = state.balances;
    ContractAssert(caller in balances && balances[caller] >= qty, "Caller has insufficient funds");
    balances[caller] -= qty;
    if (!(target in balances)) {
      balances[target] = 0;
    }
    balances[target] += qty;
    state.balances = balances;
    return {state};
  }
  if (input.function === "balance") {
    let target;
    if (input.target) {
      target = input.target;
    } else {
      target = caller;
    }
    const ticker = state.ticker;
    const balances = state.balances;
    ContractAssert(typeof target === "string", "Must specify target to retrieve balance for.");
    return {
      result: {
        target,
        ticker,
        balance: target in balances ? balances[target] : 0
      }
    };
  }
  throw new ContractError("No function supplied or function not recognised.");
}`;

let initial = `
{
  "name": "NFTerminator",
  "ticker": "NFTRM",
  "description": "Test NFT, it is a terminator for sure",
  "balances": {
    "ljvCPN31XCLPkBo9FUeB7vAK0VC6-eY52-CS-6Iho8U": 1
  }
}`;

smartweave
  .createContract(client, wallet, src, initial)
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
