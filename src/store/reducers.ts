import { combineReducers } from "redux";

import addressReducer from "./reducers/address";
import themeReducer from "./reducers/theme";
import navThemeReducer from "./reducers/nav_theme";

export const plainReducers = {
  addressReducer,
  themeReducer,
  navThemeReducer,
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
