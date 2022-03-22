export interface ISearchAction {
  type: "SET_SEARCH_OPEN";
  payload: {
    open: boolean;
  };
}

export default function searchReducer(
  state: boolean = false,
  action: ISearchAction
) {
  if (action.type !== "SET_SEARCH_OPEN") return state;
  else return action.payload.open;
}
