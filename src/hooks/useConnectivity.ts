import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  return { isOnline };
}
