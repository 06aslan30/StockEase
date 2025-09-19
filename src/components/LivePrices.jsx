import React from 'react';
import { useSSEPrices } from '@/hooks/useSSEPrices';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const LivePrices = ({ tickers, onDataUpdate, portfolioHoldings = [] }) => {
  const { data: liveData, connected } = useSSEPrices(tickers);

  // Notify the parent component whenever data updates
  React.useEffect(() => {
    if (onDataUpdate && Object.keys(liveData).length > 0) {
      onDataUpdate(liveData);
    }
  }, [liveData, onDataUpdate]);

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Portfolio Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-muted-foreground">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <CardDescription>Live prices for the stocks in your portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolioHoldings.length > 0 ? (
              portfolioHoldings.map((holding) => {
                const stock = liveData[holding.symbol];
                return (
                  <TableRow key={holding.symbol}>
                    <TableCell>
                      <div className="font-medium">{holding.symbol.replace('.NS', '')}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">{stock?.name || ''}</div>
                    </TableCell>
                    <TableCell>{holding.quantity}</TableCell>
                    <TableCell className="text-right">
                      {stock ? `${stock.price?.toFixed(2)} ${stock.currency}` : 'Fetching...'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${getChangeColor(stock?.changePercent)}`}>
                      {stock ? `${stock.changePercent?.toFixed(2)}%` : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No stocks in portfolio to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LivePrices;