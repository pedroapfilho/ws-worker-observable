import { useObservableState } from "observable-hooks";
import { useWebSocketClient } from "@/hooks/useWebSocketClient";

export const useWebSocketData = (channel: string, url: string) => {
  const websocket$ = useWebSocketClient(channel, url);

  const [data] = useObservableState(() => websocket$, null);

  return data;
};
