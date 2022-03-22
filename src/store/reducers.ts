import { combineReducers } from "redux";

import addressReducer from "./reducers/address";
import themeReducer from "./reducers/theme";
import navThemeReducer from "./reducers/nav_theme";
import searchReducer from "./reducers/search";

export const plainReducers = {
  addressReducer,
  themeReducer,
  navThemeReducer,
  searchReducer,
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
