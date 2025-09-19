import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UsageTracker = ({ refreshKey }) => {
  const [usage, setUsage] = useState({ reports_generated: 0, questions_asked: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      setIsLoading(true);
      const userId = 1; // Hardcoded user ID for MVP

      const { data, error } = await supabase
        .from('usage')
        .select('reports_generated, questions_asked')
        .eq('user_id', userId)
        .single();

      if (data) {
        setUsage(data);
      }
      setIsLoading(false);
    };

    fetchUsage();
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Reports Generated: <span className="font-medium text-foreground">{usage.reports_generated}</span></span>
            <span>Questions Asked: <span className="font-medium text-foreground">{usage.questions_asked}</span></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageTracker;
