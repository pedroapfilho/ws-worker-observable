"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

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

const useWebSocket = <T extends object>(url: string): T | null => {
  const [data, setData] = useState<T | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    const messageData = event.data;

    try {
      const parsedData = JSON.parse(messageData) as T;

      // Fake heavy calculation
      for (let i = 0; i < 10000000; i += 1) {}

      setData(parsedData);
    } catch (error) {
      console.error("Failed to process message:", error);
    }
  }, []);

  useEffect(() => {
    if (!wsRef.current) {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.addEventListener("message", handleMessage);
      ws.addEventListener("error", (event) => {
        console.error("WebSocket error:", event);
      });

      return () => {
        ws.removeEventListener("message", handleMessage);
        ws.close();
      };
    }
  }, [url, handleMessage]);

  return data;
};

const Page = () => {
  const tradeData = useWebSocket<TradeData>(
    "wss://stream.binance.com:9443/ws/btcusdt@trade"
  );
  const orderBookData = useWebSocket<OrderBookData>(
    "wss://stream.binance.com:9443/ws/btcusdt@depth20"
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
