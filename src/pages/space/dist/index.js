"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
exports.__esModule = true;
exports.getStaticProps = void 0;
var ui_1 = require("@verto/ui");
var react_1 = require("react");
var animations_1 = require("../../utils/animations");
var framer_motion_1 = require("framer-motion");
var graph_1 = require("../../utils/graph");
var react_chartjs_2_1 = require("react-chartjs-2");
var router_1 = require("next/router");
var user_1 = require("../../utils/user");
var arweave_1 = require("../../utils/arweave");
var react_redux_1 = require("react-redux");
var react_2 = require("@iconicicons/react");
var Search_1 = require("../../components/Search");
var swr_1 = require("swr");
var axios_1 = require("axios");
var js_1 = require("@verto/js");
var head_1 = require("next/head");
var Metas_1 = require("../../components/Metas");
var ListingModal_1 = require("../../components/ListingModal");
var infinite_scroll_1 = require("../../utils/infinite_scroll");
var space_module_sass_1 = require("../../styles/views/space.module.sass");
var client = new js_1["default"]();
var Space = function (props) {
  var _a, _b;
  var tokens = swr_1["default"](
    "getTokens",
    function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                axios_1["default"].get(
                  arweave_1.CACHE_URL + "/site/communities/top"
                ),
              ];
            case 1:
              data = _a.sent().data;
              return [2 /*return*/, data];
          }
        });
      });
    },
    {
      initialData: props.tokens,
    }
  ).data;
  var featured = swr_1["default"](
    "getFeatured",
    function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                axios_1["default"].get(
                  arweave_1.CACHE_URL + "/site/communities/random"
                ),
              ];
            case 1:
              data = _a.sent().data;
              return [2 /*return*/, data];
          }
        });
      });
    },
    {
      initialData: props.featured,
    }
  ).data;
  var arts = swr_1["default"](
    "getArts",
    function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4 /*yield*/,
                axios_1["default"].get(
                  arweave_1.CACHE_URL + "/site/artworks/random"
                ),
              ];
            case 1:
              data = _a.sent().data;
              return [
                2 /*return*/,
                data.map(function (val) {
                  return __assign(__assign({}, val), {
                    owner: __assign(__assign({}, val.owner), {
                      image: val.owner.image
                        ? "https://arweave.net/" + val.owner.image
                        : user_1.randomEmoji(),
                    }),
                  });
                }),
              ];
          }
        });
      });
    },
    {
      initialData: props.arts,
    }
  ).data;
  var _c = react_1.useState({}),
    prices = _c[0],
    setPrices = _c[1];
  var _d = react_1.useState({}),
    history = _d[0],
    setHistory = _d[1];
  var _e = react_1.useState(1),
    currentPage = _e[0],
    setCurrentPage = _e[1];
  var _f = react_1.useState(featured[0]),
    currentTokenData = _f[0],
    setCurrentTokenData = _f[1];
  var router = router_1.useRouter();
  var theme = ui_1.useTheme();
  var listModal = ui_1.useModal();
  react_1.useEffect(
    function () {
      var timeout = setTimeout(function () {
        // @ts-ignore
        setCurrentPage(function (val) {
          if (val === 4) return 1;
          else return val + 1;
        });
      }, 5000);
      return function () {
        return clearTimeout(timeout);
      };
    },
    [currentPage]
  );
  react_1.useEffect(
    function () {
      setCurrentTokenData(featured[currentPage - 1]);
    },
    [currentPage]
  );
  react_1.useEffect(function () {
    (function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var arweavePrice, _loop_1, _i, _a, id;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              return [4 /*yield*/, arweave_1.arPrice()];
            case 1:
              arweavePrice = _b.sent();
              _loop_1 = function (id) {
                var res;
                return __generator(this, function (_a) {
                  switch (_a.label) {
                    case 0:
                      return [4 /*yield*/, client.getPrice(id)];
                    case 1:
                      res = _a.sent();
                      if (res.price)
                        setPrices(function (val) {
                          var _a;
                          return __assign(
                            __assign({}, val),
                            ((_a = {}),
                            (_a[id] = (res.price * arweavePrice).toFixed(2)),
                            _a)
                          );
                        });
                      return [2 /*return*/];
                  }
                });
              };
              (_i = 0), (_a = __spreadArrays(tokens, featured, arts));
              _b.label = 2;
            case 2:
              if (!(_i < _a.length)) return [3 /*break*/, 5];
              id = _a[_i].id;
              return [5 /*yield**/, _loop_1(id)];
            case 3:
              _b.sent();
              _b.label = 4;
            case 4:
              _i++;
              return [3 /*break*/, 2];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    })();
  }, []);
  react_1.useEffect(function () {
    (function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var _loop_2, _i, featured_1, id;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _loop_2 = function (id) {
                var res;
                return __generator(this, function (_a) {
                  switch (_a.label) {
                    case 0:
                      return [4 /*yield*/, client.getPriceHistory(id)];
                    case 1:
                      res = _a.sent();
                      if (Object.keys(res).length) {
                        setHistory(function (val) {
                          var _a;
                          return __assign(
                            __assign({}, val),
                            ((_a = {}), (_a[id] = res), _a)
                          );
                        });
                      }
                      return [2 /*return*/];
                  }
                });
              };
              (_i = 0), (featured_1 = featured);
              _a.label = 1;
            case 1:
              if (!(_i < featured_1.length)) return [3 /*break*/, 4];
              id = featured_1[_i].id;
              return [5 /*yield**/, _loop_2(id)];
            case 2:
              _a.sent();
              _a.label = 3;
            case 3:
              _i++;
              return [3 /*break*/, 1];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    })();
  }, []);
  // preload logos of featured items
  react_1.useEffect(function () {
    for (var _i = 0, featured_2 = featured; _i < featured_2.length; _i++) {
      var psc = featured_2[_i];
      var logo = new Image();
      logo.src = "https://arweave.net/" + psc.logo;
    }
  }, []);
  var _g = react_1.useState(),
    userData = _g[0],
    setUserData = _g[1];
  var address = react_redux_1.useSelector(function (state) {
    return state.addressReducer;
  });
  var setToast = ui_1.useToasts().setToast;
  react_1.useEffect(function () {
    (function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var user;
        var _a;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              return [4 /*yield*/, client.getUser(address)];
            case 1:
              user = (_a = _b.sent()) !== null && _a !== void 0 ? _a : null;
              setUserData(user);
              return [2 /*return*/];
          }
        });
      });
    })();
  }, []);
  // all tokens
  var _h = infinite_scroll_1["default"](loadMore),
    loadingAllTokens = _h.loading,
    allTokens = _h.data;
  function loadMore() {
    return __awaiter(this, void 0, void 0, function () {
      var items, data, _loop_3, _i, data_1, token;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            items = [];
            return [
              4 /*yield*/,
              axios_1["default"].get(
                arweave_1.CACHE_URL + "/site/tokens/" + allTokens.length
              ),
            ];
          case 1:
            data = _a.sent().data;
            _loop_3 = function (token) {
              var price, _a;
              return __generator(this, function (_b) {
                switch (_b.label) {
                  case 0:
                    if (
                      __spreadArrays(tokens, items, allTokens).find(function (
                        _a
                      ) {
                        var id = _a.id;
                        return id === token.id;
                      })
                    )
                      return [2 /*return*/, "continue"];
                    return [4 /*yield*/, arweave_1.arPrice()];
                  case 1:
                    _a = _b.sent();
                    return [4 /*yield*/, client.getPrice(token.id)];
                  case 2:
                    price = _a * _b.sent().price;
                    if (!token.owner.image)
                      token.owner.image = user_1.randomEmoji();
                    else
                      token.owner.image =
                        "https://arweave.net/" + token.owner.image;
                    items.push(__assign(__assign({}, token), { price: price }));
                    return [2 /*return*/];
                }
              });
            };
            (_i = 0), (data_1 = data);
            _a.label = 2;
          case 2:
            if (!(_i < data_1.length)) return [3 /*break*/, 5];
            token = data_1[_i];
            return [5 /*yield**/, _loop_3(token)];
          case 3:
            _a.sent();
            _a.label = 4;
          case 4:
            _i++;
            return [3 /*break*/, 2];
          case 5:
            return [2 /*return*/, items];
        }
      });
    });
  }
  var search = Search_1.useSearch();
  return React.createElement(
    ui_1.Page,
    null,
    React.createElement(
      head_1["default"],
      null,
      React.createElement("title", null, "Verto - Space"),
      React.createElement(Metas_1["default"], { title: "Space" })
    ),
    React.createElement(ui_1.Spacer, { y: 3 }),
    React.createElement(
      "div",
      {
        className:
          space_module_sass_1["default"].Featured +
          " " +
          (theme === "Dark" ? space_module_sass_1["default"].DarkFeatured : ""),
      },
      React.createElement(
        framer_motion_1.AnimatePresence,
        null,
        React.createElement(
          framer_motion_1.motion.div,
          {
            className: space_module_sass_1["default"].FeaturedItem,
            key: currentPage,
            initial: { x: 1000, opacity: 0, translateY: "-50%" },
            animate: { x: 0, opacity: 1, translateY: "-50%" },
            exit: { x: -1000, opacity: 0, translateY: "-50%" },
            transition: {
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            },
            onClick: function () {
              return router.push("/space/" + currentTokenData.id);
            },
          },
          React.createElement(
            "div",
            { className: space_module_sass_1["default"].TokenInfo },
            React.createElement("img", {
              src: "https://arweave.net/" + currentTokenData.logo,
              alt: "token-logo",
              draggable: false,
            }),
            React.createElement(
              "div",
              null,
              React.createElement("h1", null, currentTokenData.name),
              React.createElement("h2", null, currentTokenData.ticker),
              React.createElement(
                "p",
                null,
                (_a = currentTokenData.description) === null || _a === void 0
                  ? void 0
                  : _a.slice(0, 70),
                ((_b = currentTokenData.description) === null || _b === void 0
                  ? void 0
                  : _b.length) > 70 && "..."
              )
            )
          ),
          React.createElement(
            "div",
            { className: space_module_sass_1["default"].PriceData },
            (prices[currentTokenData.id] &&
              React.createElement(
                "h2",
                null,
                "$",
                prices[currentTokenData.id].toLocaleString()
              )) ||
              React.createElement("h2", null, "$--"),
            React.createElement(
              "div",
              { className: space_module_sass_1["default"].GraphData },
              history[currentTokenData.id] &&
                React.createElement(react_chartjs_2_1.Line, {
                  data: {
                    labels: Object.keys(history[currentTokenData.id]).reverse(),
                    datasets: [
                      __assign(
                        __assign(
                          {
                            data: Object.values(
                              history[currentTokenData.id]
                            ).reverse(),
                          },
                          graph_1.GraphDataConfig
                        ),
                        { borderColor: "#ffffff" }
                      ),
                    ],
                  },
                  options: graph_1.GraphOptions({
                    theme: theme,
                    tooltipText: function (_a) {
                      var value = _a.value;
                      return (
                        Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        }) + " AR"
                      );
                    },
                  }),
                })
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: space_module_sass_1["default"].Paginator },
        new Array(4).fill("_").map(function (_, i) {
          return React.createElement("span", {
            className:
              currentPage === i + 1
                ? space_module_sass_1["default"].ActivePage
                : "",
            // @ts-ignore
            onClick: function () {
              return setCurrentPage(i + 1);
            },
            key: i,
          });
        })
      )
    ),
    React.createElement(ui_1.Spacer, { y: 4 }),
    React.createElement(
      "h1",
      { className: "Title" },
      "Art ",
      "&",
      " Collectibles",
      address &&
        React.createElement(react_2.SearchIcon, {
          className: space_module_sass_1["default"].Search,
          onClick: function () {
            return search.setOpen(true);
          },
        })
    ),
    React.createElement(ui_1.Spacer, { y: 2 }),
    React.createElement(
      "div",
      { className: space_module_sass_1["default"].Cards },
      arts.map(function (art, i) {
        var _a;
        return React.createElement(
          framer_motion_1.motion.div,
          __assign({ key: i }, animations_1.cardAnimation(i), {
            className: space_module_sass_1["default"].Card,
          }),
          (art.items &&
            React.createElement(ui_1.Card.Collection, {
              name: art.name,
              userData: {
                avatar: art.owner.image,
                name: art.owner.name,
                usertag: art.owner.username,
              },
              images: art.items.map(function (txID) {
                return "https://arweave.net/" + txID;
              }),
              onClick: function () {
                return router.push("/space/" + art.id);
              },
            })) ||
            React.createElement(ui_1.Card.Asset, {
              name: art.name,
              userData: {
                avatar: art.owner.image,
                name: art.owner.name,
                usertag: art.owner.username,
              },
              // @ts-ignore
              price:
                (_a = prices[art.id]) !== null && _a !== void 0 ? _a : " ??",
              image: "https://arweave.net/" + art.id,
              onClick: function () {
                return router.push("/space/" + art.id);
              },
            })
        );
      })
    ),
    React.createElement(ui_1.Spacer, { y: 4 }),
    React.createElement("h1", { className: "Title" }, "Communities"),
    React.createElement(ui_1.Spacer, { y: 2 }),
    React.createElement(
      "div",
      { className: space_module_sass_1["default"].Cards },
      tokens.map(function (token, i) {
        var _a;
        return React.createElement(
          framer_motion_1.motion.div,
          __assign({ key: i }, animations_1.cardAnimation(i + 4), {
            className: space_module_sass_1["default"].Card,
          }),
          React.createElement(ui_1.Card.Asset, {
            name: token.name,
            // @ts-ignore
            price:
              (_a = prices[token.id]) !== null && _a !== void 0 ? _a : " ??",
            image: "https://arweave.net/" + token.logo,
            ticker: token.ticker,
            onClick: function () {
              return router.push("/space/" + token.id);
            },
          })
        );
      })
    ),
    React.createElement(ui_1.Spacer, { y: 4 }),
    React.createElement(
      "h1",
      { className: "Title" },
      "All",
      React.createElement(
        "div",
        { className: "ActionSheet" },
        React.createElement(
          ui_1.Button,
          {
            small: true,
            onClick: function () {
              if (!userData)
                return setToast({
                  description: "Please setup your Verto ID first",
                  type: "error",
                  duration: 5300,
                });
              listModal.setState(true);
            },
            style: { padding: ".35em 1.2em" },
          },
          "Add"
        )
      )
    ),
    React.createElement(ui_1.Spacer, { y: 2 }),
    React.createElement(
      "div",
      { className: space_module_sass_1["default"].Cards },
      allTokens.map(function (token, i) {
        var _a, _b;
        return React.createElement(
          framer_motion_1.motion.div,
          __assign({ key: i }, animations_1.cardAnimation(i), {
            className:
              space_module_sass_1["default"].Card +
              " " +
              space_module_sass_1["default"].AllTokensCard,
          }),
          (token.type === "community" &&
            React.createElement(ui_1.Card.Asset, {
              name: token.name,
              // @ts-ignore
              price: (_a = token.price) !== null && _a !== void 0 ? _a : " ??",
              image: "https://arweave.net/" + token.logo,
              ticker: token.ticker,
              onClick: function () {
                return router.push("/space/" + token.id);
              },
            })) ||
            (token.type === "collection" &&
              React.createElement(ui_1.Card.Collection, {
                name: token.name,
                userData: {
                  avatar: token.owner.image,
                  name: token.owner.name,
                  usertag: token.owner.username,
                },
                images: token.items.map(function (id) {
                  return "https://arweave.net/" + id;
                }),
                onClick: function () {
                  return router.push("/space/" + token.id);
                },
              })) ||
            React.createElement(ui_1.Card.Asset, {
              name: token.name,
              userData: {
                avatar: token.owner.image,
                name: token.owner.name,
                usertag: token.owner.username,
              },
              // @ts-ignore
              price: (_b = token.price) !== null && _b !== void 0 ? _b : " ??",
              image: "https://arweave.net/" + token.id,
              onClick: function () {
                return router.push("/space/" + token.id);
              },
            })
        );
      })
    ),
    React.createElement(
      framer_motion_1.AnimatePresence,
      null,
      loadingAllTokens &&
        React.createElement(
          framer_motion_1.motion.div,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { ease: "easeInOut", duration: 0.22 },
          },
          React.createElement(ui_1.Spacer, { y: 2 }),
          React.createElement(ui_1.Loading.Spinner, {
            style: { margin: "0 auto" },
          })
        )
    ),
    React.createElement(
      ListingModal_1["default"],
      __assign({}, listModal.bindings)
    ),
    React.createElement(Search_1["default"], __assign({}, search))
  );
};
function getStaticProps() {
  return __awaiter(this, void 0, void 0, function () {
    var tokens, featured, arts;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            axios_1["default"].get(
              arweave_1.CACHE_URL + "/site/communities/top"
            ),
          ];
        case 1:
          tokens = _a.sent().data;
          return [
            4 /*yield*/,
            axios_1["default"].get(
              arweave_1.CACHE_URL + "/site/communities/random"
            ),
          ];
        case 2:
          featured = _a.sent().data;
          return [
            4 /*yield*/,
            axios_1["default"].get(
              arweave_1.CACHE_URL + "/site/artworks/random"
            ),
          ];
        case 3:
          arts = _a.sent().data;
          arts = arts.map(function (val) {
            return __assign(__assign({}, val), {
              owner: __assign(__assign({}, val.owner), {
                image: val.owner.image
                  ? "https://arweave.net/" + val.owner.image
                  : user_1.randomEmoji(),
              }),
            });
          });
          return [
            2 /*return*/,
            {
              props: { tokens: tokens, featured: featured, arts: arts },
              revalidate: 1,
            },
          ];
      }
    });
  });
}
exports.getStaticProps = getStaticProps;
exports["default"] = Space;
