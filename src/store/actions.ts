import { DisplayTheme } from "@verto/ui/dist/types";
import { IAddressAction } from "./reducers/address";
import { INavThemeAction, NavTheme } from "./reducers/nav_theme";
import { ISearchAction } from "./reducers/search";
import { IThemeAction } from "./reducers/theme";

export function updateAddress(address: string): IAddressAction {
  return {
    type: "UPDATE_ADDRESS",
    payload: {
      address,
    },
  };
}

export function updateTheme(theme: DisplayTheme | "System"): IThemeAction {
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

export function updateNavTheme(theme: NavTheme): INavThemeAction {
  return {
    type: "UPDATE_NAV_THEME",
    payload: {
      theme,
    },
  };
}

export function resetNavTheme(): INavThemeAction {
  return {
    type: "UPDATE_NAV_THEME",
    payload: {
      theme: "Default",
    },
  };
}

export function updateSearchOpen(open: boolean): ISearchAction {
  return {
    type: "SET_SEARCH_OPEN",
    payload: {
      open,
    },
  };
}
