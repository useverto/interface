export interface IAddressAction {
  type: "UPDATE_ADDRESS" | "USER_SIGNOUT";
  payload: {
    address: string;
  };
}

export default function addressReducer(
  state: string = null,
  action: IAddressAction
) {
  switch (action.type) {
    case "UPDATE_ADDRESS":
      return action.payload.address;

    case "USER_SIGNOUT":
      return null;
  }

  return state;
}
