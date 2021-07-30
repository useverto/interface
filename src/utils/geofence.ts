import { useEffect, useState } from "react";
import axios from "axios";

const useGeofence = () => {
  const [state, setState] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { ip },
      } = await axios.get("https://api.my-ip.io/ip.json");
      const { data } = await axios.get(`https://ipwhois.app/json/${ip}`);

      if (data.country_code === "US") setState(true);
    })();
  }, []);

  return state;
};

export default useGeofence;
