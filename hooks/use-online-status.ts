import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(
        Boolean(state.isConnected && state.isInternetReachable !== false),
      );
    });

    void NetInfo.fetch().then((state) => {
      setIsOnline(
        Boolean(state.isConnected && state.isInternetReachable !== false),
      );
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
