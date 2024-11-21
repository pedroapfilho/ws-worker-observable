"use client";

import React from "react";
import { useWebSocketData } from "@/hooks/useWebSocketData";

const Page = () => {
  const channel = "order-book";
  const url = "wss://stream.binance.com:9443/ws/btcusdt@depth20";
  const data = useWebSocketData(channel, url);

  return (
    <div>
      <h1>WebSocket Data</h1>

      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>Waiting for data...</p>
      )}
    </div>
  );
};

export default Page;
