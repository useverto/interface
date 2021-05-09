import { IAddressAction } from "./reducers/address";

export function updateAddress(address: string): IAddressAction {
  return {
    type: "UPDATE_ADDRESS",
    payload: {
      address,
    },
  };
}

export function signOutClear() {
  return {
    type: "USER_SIGNOUT",
  };
}
