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
    "wss://stream.binance.com:9443/ws/btcusdt@depth20"
  );
  const { data: tradeData } = useWebSocketData<TradeData>(
    "trade",
    "wss://stream.binance.com:9443/ws/btcusdt@trade"
  );

  // create a button to stop the main thread
  return (
    <div>
      {/* <button
        onClick={() => {
          console.log("Stopping main thread");
          while (true) {}
        }}
      >
        Stop main thread
      </button> */}

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
