import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

import PortfolioForm from '@/components/PortfolioForm';
import AdviceCard from '@/components/AdviceCard';
import UsageTracker from '@/components/UsageTracker';
import LivePrices from '@/components/LivePrices';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Home = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [portfolio, setPortfolio] = useState(null);
  const [tickers, setTickers] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Fetch the latest portfolio from Supabase on initial load or when updated
  useEffect(() => {
    const fetchPortfolio = async () => {
      const userId = 1; // Hardcoded user ID
      const { data, error } = await supabase
        .from('portfolios')
        .select('portfolio_data, id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching portfolio:', error);
        setPortfolio({}); // Set to empty object on error
      } else if (data) {
        setPortfolio(data);
        // Safely extract tickers from the new data structure
        const holdings = data.portfolio_data?.holdings || [];
        setTickers(holdings.map(h => h.symbol));
      }
    };
    fetchPortfolio();
  }, [refreshKey]);

  const handlePortfolioUpdate = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // 2. This function is called by LivePrices whenever new data arrives
  const handlePriceUpdate = useCallback((quotes) => {
    setLiveQuotes(quotes);
  }, []);

  // 3. This function is called when the user clicks the "Generate Advice" button
  const handleGenerateAdvice = async () => {
    if (!portfolio?.portfolio_data?.holdings) {
      console.warn('[Advice Engine] Portfolio data is missing.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('http://localhost:3001/api/generate-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolio: portfolio.portfolio_data, portfolioId: portfolio.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[API] Advice generated successfully:', result);

      // Increment the usage counter
      const userId = 1; // Hardcoded user ID
      const { error: usageError } = await supabase.rpc('increment_reports_generated', { user_id_to_update: userId });
      if (usageError) {
        console.error('Error incrementing usage counter:', usageError);
      }

      // Trigger a refresh in the AdviceCard and UsageTracker
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('Error generating advice:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview and real-time advice.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioForm onPortfolioUpdate={handlePortfolioUpdate} />
          <LivePrices tickers={tickers} onDataUpdate={handlePriceUpdate} portfolioHoldings={portfolio?.portfolio_data?.holdings} />
        </div>
        
        <div className="space-y-8">
          <div className="flex flex-col space-y-4">
            <Button onClick={handleGenerateAdvice} disabled={isGenerating || Object.keys(liveQuotes).length === 0}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isGenerating ? 'Generating...' : 'Generate Advice'}
            </Button>
            <AdviceCard refreshKey={refreshKey} />
          </div>
          <UsageTracker refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default Home;
