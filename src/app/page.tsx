"use client";

import React from "react";
import { useWebSocketData } from "@/hooks/useWebSocketData";

const Page = () => {
  const ob = useWebSocketData(
    "order-book",
    "wss://stream.binance.com:9443/ws/btcusdt@depth20"
  );
  const trade = useWebSocketData(
    "trade",
    "wss://stream.binance.com:9443/ws/btcusdt@trade"
  );

  return (
    <div>
      {trade ? (
        <pre>{JSON.stringify(trade, null, 2)}</pre>
      ) : (
        <p>Waiting for trade data...</p>
      )}

      {ob ? (
        <pre>{JSON.stringify(ob, null, 2)}</pre>
      ) : (
        <p>Waiting for order book data...</p>
      )}
    </div>
  );
};

export default Page;
