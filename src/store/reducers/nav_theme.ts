export type NavTheme = "Default" | "BlurDark" | "BlurLight";

export interface INavThemeAction {
  type: "UPDATE_NAV_THEME";
  payload: {
    theme: NavTheme;
  };
}

export default function navThemeReducer(
  state: NavTheme = "Default",
  action: INavThemeAction
) {
  if (action.type !== "UPDATE_NAV_THEME") return state;
  else return action.payload.theme;
}
