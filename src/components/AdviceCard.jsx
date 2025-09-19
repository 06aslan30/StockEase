import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

const AdviceCard = ({ refreshKey }) => {
  const [latestReport, setLatestReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSnapshot, setShowSnapshot] = useState(false);

  useEffect(() => {
    const fetchLatestAdvice = async () => {
      setIsLoading(true);
      const userId = 1; // Hardcoded user ID for MVP

      const { data, error } = await supabase
        .from('reports')
        .select('advice, created_at, market_snapshot')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching advice:', error);
        setLatestReport(null);
      } else if (data) {
        setLatestReport(data);
      }
      setIsLoading(false);
    };

    fetchLatestAdvice();
  }, [refreshKey]);

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Advice</CardTitle>
        {latestReport && (
            <CardDescription>
                Generated on {formatTimestamp(latestReport.created_at)}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading advice...</p>
        ) : latestReport ? (
          <div>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>
                {latestReport.advice}
              </ReactMarkdown>
            </div>
            {showSnapshot && latestReport.market_snapshot && (
                <div className="mt-4">
                    <h4 className="font-bold mb-2">Market Snapshot</h4>
                    <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">
                        {JSON.stringify(latestReport.market_snapshot, null, 2)}
                    </pre>
                </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No advice available. Save your portfolio and generate a new report.</p>
        )}
      </CardContent>
      {latestReport && latestReport.market_snapshot && (
        <CardFooter>
            <Button variant="secondary" size="sm" onClick={() => setShowSnapshot(!showSnapshot)}>
                {showSnapshot ? 'Hide Snapshot' : 'View Snapshot'}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AdviceCard;