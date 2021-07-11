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
var ui_1 = require("@verto/ui");
var react_1 = require("react");
var smartweave_1 = require("smartweave");
var arweave_1 = require("../utils/arweave");
var react_2 = require("@iconicicons/react");
var animations_1 = require("../utils/animations");
var react_redux_1 = require("react-redux");
var framer_motion_1 = require("framer-motion");
var user_1 = require("../utils/user");
var format_1 = require("../utils/format");
var js_1 = require("@verto/js");
var axios_1 = require("axios");
var ListingModal_module_sass_1 = require("../styles/components/ListingModal.module.sass");
var verto = new js_1["default"]();
function ListingModal(props) {
  var _this = this;
  var contractIDInput = ui_1.useInput();
  var _a = react_1.useState(""),
    tokenName = _a[0],
    setTokenName = _a[1];
  // TODO: custom layout
  var _b = react_1.useState("community"),
    selectedLayout = _b[0],
    setSelectedLayout = _b[1];
  var _c = react_1.useState(false),
    loading = _c[0],
    setLoading = _c[1];
  react_1.useEffect(
    function () {
      contractIDInput.setStatus(undefined);
      contractIDInput.setState("");
      setTokenName("");
      setSelectedLayout("community");
    },
    [props.open]
  );
  var _d = react_1.useState(false),
    disabled = _d[0],
    setDisabled = _d[1];
  react_1.useEffect(
    function () {
      (function () {
        return __awaiter(_this, void 0, void 0, function () {
          var currentState, _a;
          var _b;
          return __generator(this, function (_c) {
            switch (_c.label) {
              case 0:
                if (!arweave_1.isAddress(contractIDInput.state))
                  return [2 /*return*/, setTokenName("")];
                _c.label = 1;
              case 1:
                _c.trys.push([1, 3, , 4]);
                return [
                  4 /*yield*/,
                  smartweave_1.readContract(
                    arweave_1.client,
                    contractIDInput.state
                  ),
                ];
              case 2:
                currentState = _c.sent();
                setTokenName(
                  (_b = currentState.ticker) !== null && _b !== void 0 ? _b : ""
                );
                if (
                  !currentState.ticker ||
                  !currentState.name ||
                  !currentState.balances
                ) {
                  setToast({
                    description: "Not a token contract",
                    type: "error",
                    duration: 4500,
                  });
                  setDisabled(true);
                  return [2 /*return*/];
                }
                setDisabled(false);
                if (currentState.roles || currentState.votes)
                  setSelectedLayout("community");
                else setSelectedLayout("art");
                return [3 /*break*/, 4];
              case 3:
                _a = _c.sent();
                setToast({
                  description: "Could not read contract",
                  type: "error",
                  duration: 2750,
                });
                setDisabled(true);
                return [3 /*break*/, 4];
              case 4:
                return [2 /*return*/];
            }
          });
        });
      })();
    },
    [contractIDInput.state]
  );
  var setToast = ui_1.useToasts().setToast;
  function listToken() {
    return __awaiter(this, void 0, void 0, function () {
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (!arweave_1.isAddress(contractIDInput.state))
              return [2 /*return*/, contractIDInput.setStatus("error")];
            setLoading(true);
            _b.label = 1;
          case 1:
            _b.trys.push([1, 3, , 4]);
            return [
              4 /*yield*/,
              smartweave_1.interactWrite(
                arweave_1.client,
                "use_wallet",
                arweave_1.COMMUNITY_CONTRACT,
                {
                  function: "list",
                  id: contractIDInput.state,
                  type: selectedLayout,
                }
              ),
            ];
          case 2:
            _b.sent();
            setToast({
              description: "Token is now listed",
              type: "success",
              duration: 4500,
            });
            props.onClose();
            return [3 /*break*/, 4];
          case 3:
            _a = _b.sent();
            setToast({
              description: "Error listing token",
              type: "error",
              duration: 4500,
            });
            return [3 /*break*/, 4];
          case 4:
            setLoading(false);
            return [2 /*return*/];
        }
      });
    });
  }
  var collectionModal = ui_1.useModal();
  var collectionNameInput = ui_1.useInput("");
  var _e = react_1.useState(""),
    collectionDescription = _e[0],
    setCollectionDescription = _e[1];
  var _f = react_1.useState([]),
    collaborators = _f[0],
    setCollaborators = _f[1];
  var _g = react_1.useState([]),
    items = _g[0],
    setItems = _g[1];
  var activeAddress = react_redux_1.useSelector(function (state) {
    return state.addressReducer;
  });
  react_1.useEffect(
    function () {
      if (!collectionModal.state) return;
      collectionNameInput.setState("");
      setCollectionDescription("");
      setCollaborators([]);
      setItems([]);
      setUserQuery("");
      verto.getUser(activeAddress).then(function (user) {
        return setCollaborators([fixUserImage(user)]);
      });
    },
    [collectionModal.state]
  );
  var fixUserImage = function (user) {
    return __assign(__assign({}, user), {
      image: (user === null || user === void 0 ? void 0 : user.image)
        ? "https://arweave.net/" + user.image
        : user_1.randomEmoji(),
    });
  };
  var _h = react_1.useState(""),
    userQuery = _h[0],
    setUserQuery = _h[1];
  var _j = react_1.useState([]),
    usersResult = _j[0],
    setUsersResult = _j[1];
  react_1.useEffect(
    function () {
      (function () {
        return __awaiter(_this, void 0, void 0, function () {
          var res, data;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                res = [];
                if (userQuery === "") return [2 /*return*/, setUsersResult([])];
                // add to results if search query is an address
                if (
                  arweave_1.isAddress(userQuery) &&
                  !collaborators.find(function (collaborator) {
                    return (
                      collaborator.addresses.includes(userQuery) ||
                      collaborator.username === userQuery
                    );
                  })
                )
                  res.push({
                    username: userQuery,
                    name: "",
                    addresses: [userQuery],
                    image: user_1.randomEmoji(),
                    displaytag: format_1.formatAddress(userQuery, 12),
                  });
                return [
                  4 /*yield*/,
                  axios_1["default"].get(
                    arweave_1.CACHE_URL +
                      "/site/search/" +
                      userQuery +
                      "?type=user"
                  ),
                ];
              case 1:
                data = _a.sent().data;
                res.push.apply(
                  res,
                  data
                    .filter(function (_a) {
                      var type = _a.type,
                        username = _a.username,
                        addresses = _a.addresses;
                      return (
                        type === "user" &&
                        !collaborators.find(function (collaborator) {
                          return (
                            collaborator.username === username ||
                            collaborator.addresses.find(function (addr) {
                              return addresses.includes(addr);
                            })
                          );
                        })
                      );
                    })
                    .map(function (user) {
                      return fixUserImage(user);
                    })
                );
                setUsersResult(res);
                return [2 /*return*/];
            }
          });
        });
      })();
    },
    [userQuery]
  );
  var theme = ui_1.useTheme();
  var _k = react_1.useState(""),
    collectiblesQuery = _k[0],
    setCollectiblesQuery = _k[1];
  var _l = react_1.useState([]),
    collectiblesResult = _l[0],
    setCollectiblesResult = _l[1];
  react_1.useEffect(
    function () {
      (function () {
        return __awaiter(_this, void 0, void 0, function () {
          var data;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                if (collectiblesQuery === "") setCollectiblesResult([]);
                return [
                  4 /*yield*/,
                  axios_1["default"].get(
                    arweave_1.CACHE_URL +
                      "/site/search/" +
                      collectiblesQuery +
                      "?type=art"
                  ),
                ];
              case 1:
                data = _a.sent().data;
                setCollectiblesResult(
                  data
                    .filter(function (_a) {
                      var type = _a.type,
                        id = _a.id;
                      return type === "art" && !items.includes(id);
                    })
                    .map(function (item) {
                      return __assign(__assign({}, item), {
                        owner: fixUserImage(item.owner),
                      });
                    })
                    .splice(0, 4)
                );
                return [2 /*return*/];
            }
          });
        });
      })();
    },
    [collectiblesQuery]
  );
  function copyItemsFromClipboard() {
    return __awaiter(this, void 0, void 0, function () {
      var clipboardContent_1, parsedItems_1, _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 2, , 3]);
            return [4 /*yield*/, navigator.clipboard.readText()];
          case 1:
            clipboardContent_1 = _b.sent().trim();
            // get the format of IDs on the clipboard
            if (
              /^((([a-z0-9_-]{43}),)+)([a-z0-9_-]{43})$/i.test(
                clipboardContent_1
              )
            ) {
              // IDs separated with commas
              // e.g.: address1,address2,address3
              setItems(function (val) {
                return __spreadArrays(val, clipboardContent_1.split(","));
              });
            } else if (
              /^((([a-z0-9_-]{43})(, ))+)([a-z0-9_-]{43})$/i.test(
                clipboardContent_1
              )
            ) {
              // IDs separeted with commas and spaces
              // e.g.: address1, address2, address3
              setItems(function (val) {
                return __spreadArrays(val, clipboardContent_1.split(", "));
              });
            } else {
              // try reading it as a JSON array
              try {
                parsedItems_1 = JSON.parse(clipboardContent_1);
                if (!Array.isArray(items))
                  return [
                    2 /*return*/,
                    setToast({
                      description: "Clipboard content is not an array",
                      type: "error",
                      duration: 4500,
                    }),
                  ];
                setItems(function (val) {
                  return __spreadArrays(val, parsedItems_1);
                });
              } catch (_c) {
                setToast({
                  description: "Invalid items format",
                  type: "error",
                  duration: 4500,
                });
              }
            }
            return [3 /*break*/, 3];
          case 2:
            _a = _b.sent();
            setToast({
              description: "Could not read clipboard",
              type: "error",
              duration: 4500,
            });
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  }
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      ui_1.Modal,
      __assign({}, props, {
        className: ListingModal_module_sass_1["default"].Modal,
      }),
      React.createElement(ui_1.Modal.Title, null, "List new token"),
      React.createElement(
        ui_1.Modal.Content,
        null,
        React.createElement(
          ui_1.Input,
          __assign(
            {
              label: React.createElement(
                React.Fragment,
                null,
                "Token contract ID ",
                tokenName !== "" && "(" + tokenName + ")"
              ),
              className: ListingModal_module_sass_1["default"].Input,
              placeholder: "Contract ID",
              type: "text",
            },
            contractIDInput.bindings
          )
        ),
        React.createElement(ui_1.Spacer, { y: 2 }),
        React.createElement(
          "span",
          { className: ListingModal_module_sass_1["default"].Label },
          "Choose token layout"
        ),
        React.createElement(
          "div",
          {
            className: ListingModal_module_sass_1["default"].TokenLayoutPicker,
          },
          React.createElement(
            "div",
            {
              className:
                ListingModal_module_sass_1["default"].TokenItem +
                " " +
                (selectedLayout === "community"
                  ? ListingModal_module_sass_1["default"].ActiveItem
                  : ""),
              onClick: function () {
                return setSelectedLayout("community");
              },
            },
            React.createElement(
              "div",
              { className: ListingModal_module_sass_1["default"].Layout },
              React.createElement(CommunitySkeleton, null)
            ),
            React.createElement(
              "span",
              { className: ListingModal_module_sass_1["default"].Name },
              "Community"
            ),
            React.createElement(
              "span",
              { className: ListingModal_module_sass_1["default"].Description },
              "Recommended for community PSTs"
            )
          ),
          React.createElement(
            "div",
            {
              className:
                ListingModal_module_sass_1["default"].TokenItem +
                " " +
                (selectedLayout === "art"
                  ? ListingModal_module_sass_1["default"].ActiveItem
                  : ""),
              onClick: function () {
                return setSelectedLayout("art");
              },
            },
            React.createElement(
              "div",
              { className: ListingModal_module_sass_1["default"].Layout },
              React.createElement(ArtSkeleton, null)
            ),
            React.createElement(
              "span",
              { className: ListingModal_module_sass_1["default"].Name },
              "Art ",
              "&",
              " collectible"
            ),
            React.createElement(
              "span",
              { className: ListingModal_module_sass_1["default"].Description },
              "Recommended for arts and other collectibles"
            )
          )
        ),
        React.createElement(ui_1.Spacer, { y: 2 }),
        React.createElement(
          ui_1.Button,
          {
            small: true,
            className: ListingModal_module_sass_1["default"].Submit,
            onClick: listToken,
            loading: loading,
            disabled: disabled,
          },
          "Add to space"
        ),
        React.createElement(ui_1.Spacer, { y: 1.5 }),
        React.createElement(
          "p",
          {
            className: ListingModal_module_sass_1["default"].SideAction,
            onClick: function () {
              collectionModal.setState(true);
              props.onClose();
            },
          },
          "Create collection"
        )
      )
    ),
    React.createElement(
      ui_1.Modal,
      __assign({}, collectionModal.bindings, {
        className: ListingModal_module_sass_1["default"].Modal,
      }),
      React.createElement(ui_1.Modal.Title, null, "Create collection"),
      React.createElement(
        ui_1.Modal.Content,
        null,
        React.createElement(
          ui_1.Input,
          __assign(
            {
              label: "Name",
              className: ListingModal_module_sass_1["default"].Input,
              placeholder: "Collection name...",
              type: "text",
            },
            collectionNameInput.bindings
          )
        ),
        React.createElement(ui_1.Spacer, { y: 2 }),
        React.createElement(
          "p",
          { className: ListingModal_module_sass_1["default"].Label },
          "Description"
        ),
        React.createElement(
          "div",
          { className: ListingModal_module_sass_1["default"].Textarea },
          React.createElement(
            "textarea",
            {
              onChange: function (e) {
                return setCollectionDescription(e.target.value);
              },
              placeholder: "Add a description for the collection...",
            },
            collectionDescription !== null && collectionDescription !== void 0
              ? collectionDescription
              : ""
          )
        ),
        React.createElement(ui_1.Spacer, { y: 2 }),
        React.createElement(
          "div",
          {
            className:
              ListingModal_module_sass_1["default"].Label +
              " " +
              ListingModal_module_sass_1["default"].ActionLabel,
          },
          "Collaborators",
          React.createElement(
            ui_1.Popover,
            {
              content: React.createElement(
                "div",
                {
                  className:
                    ListingModal_module_sass_1["default"].SearchPopover,
                },
                React.createElement(
                  "div",
                  {
                    className:
                      ListingModal_module_sass_1["default"].SearchUser +
                      " " +
                      (theme === "Dark"
                        ? ListingModal_module_sass_1["default"].DarkSearchUser
                        : ""),
                  },
                  React.createElement(react_2.AtSignIcon, {
                    className: ListingModal_module_sass_1["default"].LeftIcon,
                  }),
                  React.createElement("input", {
                    type: "text",
                    placeholder: "Search for users...",
                    value: userQuery,
                    onChange: function (e) {
                      return setUserQuery(e.target.value);
                    },
                    className:
                      ListingModal_module_sass_1["default"].WithLeftIcon,
                  }),
                  React.createElement(react_2.SearchIcon, null)
                ),
                React.createElement(ui_1.Spacer, { y: 0.8 }),
                React.createElement(
                  framer_motion_1.AnimatePresence,
                  null,
                  usersResult.map(function (user, i) {
                    var _a;
                    return React.createElement(
                      framer_motion_1.motion.div,
                      __assign({}, animations_1.opacityAnimation(), {
                        key: i,
                        className: ListingModal_module_sass_1["default"].Result,
                        onClick: function () {
                          setCollaborators(function (val) {
                            return __spreadArrays(val, [user]);
                          });
                          setUsersResult(function (val) {
                            return val.filter(function (u) {
                              return u.username !== user.username;
                            });
                          });
                        },
                      }),
                      React.createElement("img", {
                        src: user.image,
                        alt: "u",
                        draggable: false,
                      }),
                      React.createElement(
                        "div",
                        {
                          className:
                            ListingModal_module_sass_1["default"].ResultInfo,
                        },
                        user.name !== "" &&
                          React.createElement("h1", null, user.name),
                        React.createElement(
                          "h2",
                          null,
                          "@",
                          (_a = user.displaytag) !== null && _a !== void 0
                            ? _a
                            : user.username
                        )
                      )
                    );
                  })
                ),
                usersResult.length === 0 &&
                  React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      "p",
                      {
                        className:
                          ListingModal_module_sass_1["default"].PopoverText,
                      },
                      (userQuery === "" && "Type to search...") ||
                        "No users found."
                    ),
                    React.createElement(ui_1.Spacer, { y: 0.55 })
                  )
              ),
              position: "left",
            },
            React.createElement(
              ui_1.Tooltip,
              { text: "Add collaborator" },
              React.createElement(
                "div",
                { className: ListingModal_module_sass_1["default"].AddAction },
                React.createElement(react_2.PlusIcon, null)
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: ListingModal_module_sass_1["default"].Collaborators },
          React.createElement(
            framer_motion_1.AnimatePresence,
            null,
            collaborators.map(function (user, i) {
              return React.createElement(
                framer_motion_1.motion.div,
                __assign(
                  {
                    className:
                      ListingModal_module_sass_1["default"].Collaborator,
                    key: i,
                  },
                  animations_1.opacityAnimation(i)
                ),
                React.createElement("img", {
                  src: user.image,
                  draggable: false,
                  alt: "U",
                }),
                !user.addresses.includes(activeAddress) &&
                  React.createElement(
                    "div",
                    {
                      className: ListingModal_module_sass_1["default"].Remove,
                      onClick: function () {
                        return setCollaborators(function (val) {
                          return val.filter(function (u) {
                            return u.username !== user.username;
                          });
                        });
                      },
                    },
                    React.createElement(react_2.TrashIcon, null)
                  )
              );
            })
          )
        ),
        React.createElement(ui_1.Spacer, { y: 1 }),
        React.createElement(
          "div",
          {
            className:
              ListingModal_module_sass_1["default"].Label +
              " " +
              ListingModal_module_sass_1["default"].ActionLabel,
          },
          "Items",
          React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center" } },
            React.createElement(
              ui_1.Tooltip,
              { text: "From clipboard" },
              React.createElement(
                "div",
                {
                  className: ListingModal_module_sass_1["default"].AddAction,
                  onClick: copyItemsFromClipboard,
                },
                React.createElement(react_2.ClipboardIcon, null)
              )
            ),
            React.createElement(ui_1.Spacer, { x: 0.75 }),
            React.createElement(
              ui_1.Popover,
              {
                content: React.createElement(
                  "div",
                  {
                    className:
                      ListingModal_module_sass_1["default"].SearchPopover,
                  },
                  React.createElement(
                    "div",
                    {
                      className:
                        ListingModal_module_sass_1["default"].SearchUser +
                        " " +
                        (theme === "Dark"
                          ? ListingModal_module_sass_1["default"].DarkSearchUser
                          : ""),
                    },
                    React.createElement("input", {
                      type: "text",
                      placeholder: "Search for an item...",
                      value: collectiblesQuery,
                      onChange: function (e) {
                        return setCollectiblesQuery(e.target.value);
                      },
                    }),
                    React.createElement(react_2.SearchIcon, null)
                  ),
                  React.createElement(ui_1.Spacer, { y: 0.8 }),
                  React.createElement(
                    framer_motion_1.AnimatePresence,
                    null,
                    collectiblesResult.map(function (item, i) {
                      return React.createElement(
                        framer_motion_1.motion.div,
                        __assign({}, animations_1.opacityAnimation(), {
                          key: i,
                          className:
                            ListingModal_module_sass_1["default"].Result,
                          onClick: function () {
                            setItems(function (val) {
                              return __spreadArrays(val, [item.id]);
                            });
                            setCollectiblesResult(function (val) {
                              return val.filter(function (_a) {
                                var id = _a.id;
                                return id !== item.id;
                              });
                            });
                          },
                        }),
                        React.createElement("img", {
                          src: "https://arweave.net/" + item.image,
                          alt: "i",
                          draggable: false,
                          className:
                            ListingModal_module_sass_1["default"].Square,
                        }),
                        React.createElement(
                          "div",
                          {
                            className:
                              ListingModal_module_sass_1["default"].ResultInfo,
                          },
                          React.createElement("h1", null, item.name),
                          React.createElement("h2", null, item.ticker)
                        )
                      );
                    })
                  ),
                  collectiblesResult.length === 0 &&
                    React.createElement(
                      React.Fragment,
                      null,
                      React.createElement(
                        "p",
                        {
                          className:
                            ListingModal_module_sass_1["default"].PopoverText,
                        },
                        (collectiblesQuery === "" && "Type to search...") ||
                          "No items found."
                      ),
                      React.createElement(ui_1.Spacer, { y: 0.55 })
                    )
                ),
                position: "left",
              },
              React.createElement(
                ui_1.Tooltip,
                { text: "Add item" },
                React.createElement(
                  "div",
                  {
                    className: ListingModal_module_sass_1["default"].AddAction,
                  },
                  React.createElement(react_2.PlusIcon, null)
                )
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: ListingModal_module_sass_1["default"].Items },
          React.createElement(
            framer_motion_1.AnimatePresence,
            null,
            items.map(function (item, i) {
              return React.createElement(
                framer_motion_1.motion.div,
                __assign(
                  { className: ListingModal_module_sass_1["default"].Item },
                  animations_1.opacityAnimation(i),
                  {
                    key: i,
                    onClick: function () {
                      return setItems(function (val) {
                        return val.filter(function (itemID) {
                          return itemID !== item;
                        });
                      });
                    },
                  }
                ),
                React.createElement("img", {
                  src: "https://arweave.net/" + item,
                  alt: "i",
                  draggable: false,
                }),
                React.createElement(
                  "div",
                  {
                    className: ListingModal_module_sass_1["default"].RemoveItem,
                  },
                  React.createElement(react_2.TrashIcon, null)
                )
              );
            })
          )
        ),
        React.createElement(ui_1.Spacer, { y: 2 }),
        React.createElement(
          ui_1.Button,
          {
            small: true,
            className: ListingModal_module_sass_1["default"].Submit,
          },
          "Submit"
        )
      )
    )
  );
}
exports["default"] = ListingModal;
var CommunitySkeleton = function () {
  return React.createElement(
    "svg",
    {
      width: "209",
      height: "176",
      viewBox: "0 0 209 176",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("rect", {
      width: "39",
      height: "7",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "87",
      width: "26",
      height: "6",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "12",
      width: "44",
      height: "13",
      rx: "3",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "98",
      width: "138",
      height: "39",
      rx: "3",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "144",
      width: "26",
      height: "6",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "155",
      width: "138",
      height: "21",
      rx: "3",
      fill: "#E4E4E4",
    }),
    React.createElement(
      "g",
      { clipPath: "url(#clip0)" },
      React.createElement("ellipse", {
        cx: "121.5",
        cy: "92",
        rx: "52.5",
        ry: "37",
        fill: "#E4E4E4",
      }),
      React.createElement("ellipse", {
        cx: "48.5",
        cy: "87",
        rx: "52.5",
        ry: "37",
        fill: "#E4E4E4",
      })
    ),
    React.createElement("rect", {
      x: "159",
      width: "50",
      height: "61",
      rx: "4",
      fill: "#E4E4E4",
    }),
    React.createElement(
      "defs",
      null,
      React.createElement(
        "clipPath",
        { id: "clip0" },
        React.createElement("rect", {
          width: "138",
          height: "43",
          fill: "white",
          transform: "translate(0 31)",
        })
      )
    )
  );
};
var ArtSkeleton = function () {
  return React.createElement(
    "svg",
    {
      width: "212",
      height: "174",
      viewBox: "0 0 212 174",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("rect", {
      x: "86",
      width: "39",
      height: "10",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "129",
      width: "30",
      height: "7",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "143",
      width: "212",
      height: "12",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "162",
      width: "212",
      height: "12",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      x: "111",
      y: "19",
      width: "101",
      height: "96",
      rx: "4",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "19",
      width: "101",
      height: "96",
      rx: "4",
      fill: "#E4E4E4",
    })
  );
};
// TODO
var CustomSkeleton = function () {
  return React.createElement(
    "svg",
    {
      width: "212",
      height: "175",
      viewBox: "0 0 212 175",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("rect", {
      width: "39",
      height: "10",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "130",
      width: "30",
      height: "7",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "144",
      width: "101",
      height: "12",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      y: "163",
      width: "101",
      height: "12",
      rx: "2",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      x: "111",
      width: "101",
      height: "68",
      rx: "4",
      fill: "#E4E4E4",
    }),
    React.createElement(
      "g",
      { clipPath: "url(#clip0)" },
      React.createElement("ellipse", {
        cx: "209",
        cy: "127",
        rx: "52",
        ry: "37",
        fill: "#E4E4E4",
      }),
      React.createElement("ellipse", {
        cx: "141.5",
        cy: "120",
        rx: "44.5",
        ry: "37",
        fill: "#E4E4E4",
      })
    ),
    React.createElement("rect", {
      y: "20",
      width: "101",
      height: "96",
      rx: "4",
      fill: "#E4E4E4",
    }),
    React.createElement("rect", {
      x: "111",
      y: "130",
      width: "101",
      height: "45",
      rx: "4",
      fill: "#E4E4E4",
    }),
    React.createElement(
      "defs",
      null,
      React.createElement(
        "clipPath",
        { id: "clip0" },
        React.createElement("rect", {
          width: "101",
          height: "43",
          fill: "white",
          transform: "translate(111 73)",
        })
      )
    )
  );
};
