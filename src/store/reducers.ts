import { combineReducers } from "redux";
import addressReducer from "./reducers/address";
import themeReducer from "./reducers/theme";

export const plainReducers = {
  addressReducer,
  themeReducer,
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
