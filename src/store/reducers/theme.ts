import { DisplayTheme } from "@verto/ui/dist/types";

export interface IThemeAction {
  type: "UPDATE_THEME" | "USER_SIGNOUT";
  payload: {
    theme: DisplayTheme | "Auto";
  };
}

export default function themeReducer(
  state: DisplayTheme = "Light",
  action: IThemeAction
) {
  switch (action.type) {
    case "UPDATE_THEME":
      return action.payload.theme;

    case "USER_SIGNOUT":
      return "Light";
  }

  return state;
}
