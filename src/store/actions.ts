import { DisplayTheme } from "@verto/ui/dist/types";
import { IAddressAction } from "./reducers/address";
import { IThemeAction } from "./reducers/theme";

export function updateAddress(address: string): IAddressAction {
  return {
    type: "UPDATE_ADDRESS",
    payload: {
      address,
    },
  };
}

export function updateTheme(theme: DisplayTheme): IThemeAction {
  return {
    type: "UPDATE_THEME",
    payload: { theme },
  };
}

export function signOutClear() {
  return {
    type: "USER_SIGNOUT",
  };
}
