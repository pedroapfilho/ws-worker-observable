import { useObservableState } from "observable-hooks";
import { useWebSocketClient } from "@/hooks/useWebSocketClient";

/**
 * Custom hook to subscribe to a WebSocket channel and receive data.
 *
 * @template T - The type of data expected from the WebSocket.
 * @param {string} channel - The WebSocket channel to subscribe to.
 * @param {string} url - The WebSocket server URL.
 * @returns {{ data: T | null, send: (message: any) => void }} - An object containing the latest data received from the WebSocket and a send function to send messages to the WebSocket.
 */
const useWebSocketData = <T>(
  channel: string,
  url: string
): { data: T | null; send: (message: string) => void } => {
  // Use the custom hook to get the observable and send function for the WebSocket client
  const { observable$, send } = useWebSocketClient<T>(channel, url);

  // Use the observable state hook to subscribe to the observable and get the latest data
  const [data] = useObservableState<T | null>(() => observable$, null);

  return { data, send };
};

export { useWebSocketData };
