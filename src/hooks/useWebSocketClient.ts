import { wrap } from "comlink";
import { Observable } from "rxjs";
import type { WebSocketClient } from "../workers/wsClient";

const createWorker = (): Worker | null => {
  // Check if the code is running in a browser environment
  if (typeof window !== "undefined") {
    return new Worker(new URL("../workers/wsClient", import.meta.url), {
      type: "module",
    });
  }
  return null;
};

const worker = createWorker();

const wsClient = worker ? wrap<WebSocketClient>(worker) : null;

type MessageEventData = {
  channel: string;
  data: string;
};

/**
 * Custom hook to create an observable that connects to a WebSocket channel and receives data.
 *
 * @template T - The type of data expected from the WebSocket.
 * @param {string} channel - The WebSocket channel to subscribe to.
 * @param {string} url - The WebSocket server URL.
 * @returns {{ observable: Observable<T>, send: (message: any) => void }} - An object containing the observable and a send function to send messages to the WebSocket.
 */
const useWebSocketClient = <T>(
  channel: string,
  url: string
): { observable: Observable<T>; send: (message: string) => void } => {
  // Handle the case where the WebSocket client is not available (e.g. in Node.js)
  if (!wsClient || typeof window === "undefined") {
    return {
      observable: new Observable<T>(),
      send: () => {
        throw new Error("WebSocket client is not available");
      },
    };
  }

  // Create an observable to handle WebSocket messages
  const observable = new Observable<T>((subscriber) => {
    try {
      // Connect to the WebSocket channel
      wsClient.connect(channel, url);
    } catch (error) {
      subscriber.error(`Failed to connect to channel ${channel}: ${error}`);
      return;
    }

    // Listener for WebSocket messages
    const listener = async (event: MessageEvent) => {
      const { channel: eventChannel, data } = event.data as MessageEventData;

      if (eventChannel === channel) {
        try {
          // Handle ping frame, each ws client has a different implementation
          if (data === "ping frame") {
            wsClient.send(channel, "pong frame");
            return;
          }
          // Parse and emit the data received from the WebSocket
          subscriber.next(JSON.parse(data));
        } catch (error) {
          subscriber.error(`Failed to process message: ${error}`);
        }
      }
    };

    // Add event listener for messages
    worker?.addEventListener("message", listener);

    // Cleanup function to remove event listener and close connection
    return () => {
      worker?.removeEventListener("message", listener);

      wsClient.disconnect(channel);
    };
  });

  // Function to send messages to the WebSocket channel
  const send = (message: string) => {
    wsClient.send(channel, message);
  };

  return { observable, send };
};

export { useWebSocketClient };
