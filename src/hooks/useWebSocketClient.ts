"use client";

import { wrap } from "comlink";
import { Observable } from "rxjs";
import type { WebSocketClient } from "../workers/wsClient";

const createWorker = () => {
  if (typeof window !== "undefined") {
    return new Worker(new URL("../workers/wsClient", import.meta.url), {
      type: "module",
    });
  }
  return undefined;
};

const worker = createWorker();
const wsClient = worker ? wrap<WebSocketClient>(worker) : null;

type MessageEventData = {
  channel: string;
  data: string;
};

const useWebSocketClient = <T>(channel: string, url: string): Observable<T> => {
  // Ensure the hook is only used in the browser
  if (!wsClient || typeof window === "undefined") {
    return new Observable<T>();
  }

  return new Observable<T>((subscriber) => {
    try {
      wsClient.connect(channel, url);
    } catch (error) {
      subscriber.error(`Failed to connect to channel ${channel}: ${error}`);
      return;
    }

    const listener = (event: MessageEvent) => {
      const { channel: eventChannel, data } = event.data as MessageEventData;

      if (eventChannel === channel) {
        subscriber.next(JSON.parse(data));
      }
    };

    worker?.addEventListener("message", listener);

    return () => {
      worker?.removeEventListener("message", listener);
      try {
        wsClient.disconnect(channel);
      } catch (error) {
        throw new Error(
          `Failed to disconnect from channel ${channel}: ${error}`
        );
      }
    };
  });
};

export { useWebSocketClient };
