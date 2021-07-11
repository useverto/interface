"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
exports.__esModule = true;
exports.isAddress = exports.arPrice = exports.balanceHistory = exports.INVITE_CONTRACT = exports.COMMUNITY_CONTRACT = exports.CACHE_URL = exports.ROOT_URL = exports.client = void 0;
var arweave_1 = require("arweave");
var axios_1 = require("axios");
var moment_1 = require("moment");
var ardb_1 = require("ardb");
exports.client = new arweave_1["default"]({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});
var gql = new ardb_1["default"](exports.client);
exports.ROOT_URL = "https://vext.vercel.app";
exports.CACHE_URL = "https://v2.cache.verto.exchange";
exports.COMMUNITY_CONTRACT = "Wgp3SpOtWXGCi1SardwQAwrOsQeW6aQn36ooo6eo8nc";
exports.INVITE_CONTRACT = ""; // TODO
exports.balanceHistory = function (address) {
  return __awaiter(void 0, void 0, Promise, function () {
    var inTxs, outTxs, txs, balance, _a, _b, _c, res, _i, txs_1, node;
    var _d;
    return __generator(this, function (_e) {
      switch (_e.label) {
        case 0:
          return [4 /*yield*/, gql.search().to(address).limit(100).find()];
        case 1:
          inTxs = _e.sent();
          return [4 /*yield*/, gql.search().from(address).limit(100).find()];
        case 2:
          outTxs = _e.sent();
          txs = inTxs
            .concat(outTxs)
            .sort(function (a, b) {
              return b.node.block.timestamp - a.node.block.timestamp;
            })
            .slice(0, 100);
          _a = parseFloat;
          _c = (_b = exports.client.ar).winstonToAr;
          return [4 /*yield*/, exports.client.wallets.getBalance(address)];
        case 3:
          balance = _a.apply(void 0, [_c.apply(_b, [_e.sent()])]);
          res =
            ((_d = {}),
            (_d[
              moment_1["default"]().format("MMM DD, YYYY - HH:mm")
            ] = balance),
            _d);
          for (_i = 0, txs_1 = txs; _i < txs_1.length; _i++) {
            node = txs_1[_i].node;
            balance += parseFloat(node.fee.ar);
            if (node.owner.address === address) {
              balance += parseFloat(node.quantity.ar);
            } else {
              balance -= parseFloat(node.quantity.ar);
            }
            res[
              moment_1["default"](node.block.timestamp * 1000).format(
                "MMM DD, YYYY - HH:mm"
              )
            ] = balance;
          }
          return [2 /*return*/, res];
      }
    });
  });
};
exports.arPrice = function () {
  return __awaiter(void 0, void 0, Promise, function () {
    var gecko;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            axios_1["default"].get(
              "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
            ),
          ];
        case 1:
          gecko = _a.sent().data;
          return [2 /*return*/, gecko.arweave.usd];
      }
    });
  });
};
exports.isAddress = function (addr) {
  return /[a-z0-9_-]{43}/i.test(addr);
};
