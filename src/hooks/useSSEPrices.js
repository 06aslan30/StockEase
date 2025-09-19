import { useState, useEffect } from 'react';

/**
 * A custom hook to subscribe to Server-Sent Events (SSE) for real-time stock prices.
 * @param {string[]} tickers - A list of stock tickers to subscribe to (e.g., ['TCS.NS', 'INFY.NS']).
 * @returns {{data: object, connected: boolean}} - The live data and connection status.
 */
export const useSSEPrices = (tickers) => {
  const [data, setData] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Do not connect if there are no tickers
    if (!tickers || tickers.length === 0) {
      setConnected(false);
      return;
    }

    const url = `/sse/prices?tickers=${tickers.join(',')}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
      setConnected(true);
    };

    // Handle incoming price updates
    eventSource.addEventListener('prices', (event) => {
      const newPrices = JSON.parse(event.data);
      // Update state by merging new prices, keyed by symbol
      setData(prevData => {
        const updatedData = { ...prevData };
        newPrices.forEach(price => {
          updatedData[price.symbol] = price;
        });
        return updatedData;
      });
    });

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
      setConnected(false);
      eventSource.close();
    };

    // Clean up the connection when the component unmounts or tickers change
    return () => {
      console.log('[SSE] Closing connection');
      eventSource.close();
      setConnected(false);
    };
  }, [tickers.join(',')]); // Re-connect if the list of tickers changes

  return { data, connected };
};
