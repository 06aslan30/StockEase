import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

const PortfolioForm = ({ onPortfolioUpdate }) => {
  const [holdings, setHoldings] = useState([{ symbol: '', quantity: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleHoldingChange = (index, field, value) => {
    const newHoldings = [...holdings];
    newHoldings[index][field] = value;
    setHoldings(newHoldings);
  };

  const addHolding = () => {
    setHoldings([...holdings, { symbol: '', quantity: '' }]);
  };

  const removeHolding = (index) => {
    const newHoldings = holdings.filter((_, i) => i !== index);
    setHoldings(newHoldings);
  };

  const validateHoldings = () => {
    for (const holding of holdings) {
      if (!holding.symbol.trim()) {
        return 'Stock symbol is required.';
      }
      if (isNaN(holding.quantity) || Number(holding.quantity) <= 0) {
        return 'Quantity must be a number greater than 0.';
      }
      // Ensure .NS suffix for NSE stocks
      if (!holding.symbol.endsWith('.NS')) {
        holding.symbol = `${holding.symbol.toUpperCase()}.NS`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateHoldings();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const portfolioData = { 
        holdings: holdings.map(h => ({ ...h, quantity: Number(h.quantity) })) 
      };
      const userId = 1; // Hardcoded user ID for MVP

      // Insert the new portfolio. Home page will fetch the latest one.
      const { error: portfolioError } = await supabase
        .from('portfolios')
        .insert([{ user_id: userId, portfolio_data: portfolioData }]);

      if (portfolioError) throw portfolioError;

      // Notify parent component to refresh data
      if (onPortfolioUpdate) {
        onPortfolioUpdate();
      }

    } catch (err) {
      setError(err.message);
      console.error("Error saving portfolio: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Portfolio</CardTitle>
        <CardDescription>Add your stock holdings below. Symbols will be automatically suffixed with .NS for NSE.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {holdings.map((holding, index) => (
            <div key={index} className="flex items-end space-x-2">
              <div className="flex-grow">
                <Label htmlFor={`symbol-${index}`} className="sr-only">Symbol</Label>
                <Input
                  id={`symbol-${index}`}
                  placeholder="e.g., TCS"
                  value={holding.symbol}
                  onChange={(e) => handleHoldingChange(index, 'symbol', e.target.value)}
                  required
                />
              </div>
              <div className="w-1/4">
                <Label htmlFor={`quantity-${index}`} className="sr-only">Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  placeholder="Quantity"
                  value={holding.quantity}
                  onChange={(e) => handleHoldingChange(index, 'quantity', e.target.value)}
                  required
                  min="1"
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeHolding(index)} disabled={holdings.length <= 1}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addHolding}>
            <Plus className="mr-2 h-4 w-4" /> Add Stock
          </Button>
          {error && <p className="text-red-500 text-sm pt-2">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Portfolio'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PortfolioForm;