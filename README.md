# WS Worker Observable

## Overview

WS Worker Observable is a TypeScript-based library designed to facilitate real-time data handling through WebSockets in a React application. It leverages RxJS observables and Web Workers to manage WebSocket connections efficiently, ensuring smooth and responsive user interfaces even when dealing with high-frequency data streams.

## Features

- **WebSocket Management**: Simplifies the process of connecting to WebSocket channels and handling incoming data.
- **RxJS Integration**: Utilizes RxJS observables to provide a reactive programming model for WebSocket data.
- **Web Workers**: Offloads WebSocket handling to Web Workers, preventing the main thread from being blocked and improving performance.
- **TypeScript Support**: Fully typed with TypeScript, providing type safety and better developer experience.

## Installation

To install the necessary dependencies, run:

```bash
npm install observable-hooks rxjs comlink
```

## Usage

### Setting Up WebSocket Client

The `WebSocketClient` class manages WebSocket connections, sending messages, and handling incoming data.

```typescript
class WebSocketClient {
    private connections: Map<string, WebSocket> = new Map();

    connect(channel: string, url: string): void {
        if (this.connections.has(channel)) {
            console.warn(`Already connected to channel: ${channel}`);
            return;
        }

        const ws = new WebSocket(url);
        ws.onmessage = (event: MessageEvent) => {
            self.postMessage({ channel, data: event.data });
        };
        ws.onclose = () => {
            this.connections.delete(channel);
        };
        this.connections.set(channel, ws);
    }

    disconnect(channel: string): void {
        const ws = this.connections.get(channel);
        if (ws) {
            ws.close();
            this.connections.delete(channel);
        }
    }

    send(channel: string, message: string): void {
        const ws = this.connections.get(channel);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        } else {
            console.error(`No open connection for channel: ${channel}`);
        }
    }
}
```

### Usage

#### Setting Up WebSocket Client

The `WebSocketClient` class manages WebSocket connections, sending messages, and handling incoming data.

#### Creating the WebSocket Hook

The `useWebSocketClient` hook creates an observable for WebSocket data and provides a function to send messages.

```typescript
import { wrap } from "comlink";
import { Observable } from "rxjs";
import type { WebSocketClient } from "../workers/wsClient";

const createWorker = (): Worker | null => {
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

const useWebSocketClient = <T>(
    channel: string,
    url: string
): { observable: Observable<T>; send: (message: string) => void } => {
    if (!wsClient || typeof window === "undefined") {
        return {
            observable: new Observable<T>(),
            send: () => {
                throw new Error("WebSocket client is not available");
            },
        };
    }

    const observable = new Observable<T>((subscriber) => {
        try {
            wsClient.connect(channel, url);
        } catch (error) {
            subscriber.error(`Failed to connect to channel ${channel}: ${error}`);
            return;
        }

        const listener = async (event: MessageEvent) => {
            const { channel: eventChannel, data } = event.data as MessageEventData;
            if (eventChannel === channel) {
                try {
                    if (data === "ping frame") {
                        wsClient.send(channel, "pong frame");
                        return;
                    }
                    const pData = JSON.parse(data);
                    if ("code" in pData) {
                        subscriber.error(pData.error);
                        return;
                    }
                    subscriber.next(pData);
                } catch (error) {
                    subscriber.error(`Failed to process message: ${error}`);
                }
            }
        };

        worker?.addEventListener("message", listener);

        return () => {
            worker?.removeEventListener("message", listener);
            wsClient.disconnect(channel);
        };
    });

    const send = (message: string) => {
        wsClient.send(channel, message);
    };

    return { observable, send };
};

export { useWebSocketClient };
```

#### Using the Hook in a React Component

The `useWebSocketData` hook subscribes to the WebSocket observable and provides the latest data.

```typescript
import { useObservableState } from "observable-hooks";
import { useWebSocketClient } from "@/hooks/useWebSocketClient";

const useWebSocketData = <T>(
    channel: string,
    url: string
): { data: T | null; send: (message: string) => void } => {
    const { observable, send } = useWebSocketClient<T>(channel, url);
    const [data] = useObservableState<T | null>(() => observable, null);
    return { data, send };
};

export { useWebSocketData };
```

#### Example Component

An example React component that uses the `useWebSocketData` hook to display trade and order book data.

```typescript
"use client";

import React from "react";
import { useWebSocketData } from "@/hooks/useWebSocketData";

type TradeData = {
    e: string;
    E: number;
    s: string;
    t: number;
    p: string;
    q: string;
    T: number;
    m: boolean;
    M: boolean;
};

type OrderBookData = {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
};

const Page = () => {
    const { data: orderBookData } = useWebSocketData<OrderBookData>(
        "order-book",
        "wss://stream.binance.com:9443/ws/btcusdt@depth20/"
    );
    const { data: tradeData } = useWebSocketData<TradeData>(
        "trade",
        "wss://stream.binance.com:9443/ws/btcusdt@trade/"
    );

    return (
        <div>
            {tradeData ? (
                <pre>{JSON.stringify(tradeData, null, 2)}</pre>
            ) : (
                <p>Waiting for trade data...</p>
            )}

            {orderBookData ? (
                <pre>{JSON.stringify(orderBookData, null, 2)}</pre>
            ) : (
                <p>Waiting for order book data...</p>
            )}
        </div>
    );
};

export default Page;
```

#### Why It's Good

- Performance: By using Web Workers, the library ensures that WebSocket handling does not block the main thread, leading to a more responsive UI.
- Scalability: The use of RxJS observables allows for easy composition and transformation of data streams, making it suitable for complex real-time applications.
- Type Safety: TypeScript provides type safety, reducing the likelihood of runtime errors and improving code maintainability.
- Ease of Use: The hooks abstract away the complexity of WebSocket management, making it easy to integrate real-time data into React components.

#### Conclusion

WS Worker Observable is a powerful tool for developers looking to integrate real-time data into their React applications efficiently. By leveraging Web Workers and RxJS, it provides a performant and scalable solution for handling WebSocket connections.

#### Binance API Documentation

The example component utilizes the Binance WebSocket API to fetch real-time trade and order book data. The Binance API provides a variety of WebSocket streams for different types of market data.

For more detailed information, please refer to the official Binance API documentation:

[Binance Spot API Documentation - WebSocket Streams](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams)

##### WebSocket Streams Used in the Example

All types were generated getting the data from the WebSocket streams and transforming it into types.

- **Trade Stream**: Provides real-time trade data for a specific symbol.
  - Endpoint: `wss://stream.binance.com:9443/ws/btcusdt@trade/`
- **Order Book Stream**: Provides real-time order book data for a specific symbol.
  - Endpoint: `wss://stream.binance.com:9443/ws/btcusdt@depth20/`
