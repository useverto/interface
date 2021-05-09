import { combineReducers } from "redux";
import addressReducer from "./reducers/address";

export const plainReducers = {
  addressReducer,
};
const reducers = combineReducers(plainReducers);

export default reducers;
export type RootState = ReturnType<typeof reducers>;
