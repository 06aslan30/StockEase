import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      const userId = 1; // Hardcoded user ID for MVP

      // Fetch all reports for the user, ordered by most recent
      const { data, error } = await supabase
        .from('reports')
        .select('id, created_at, advice')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
      } else {
        setReports(data);
      }
      setIsLoading(false);
    };

    fetchReports();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Past Reports</h1>
        <p className="text-gray-400">A log of all advice you have received.</p>
      </header>

      {isLoading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p>No reports found. Generate one from the dashboard.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="text-xl">{report.advice}</CardTitle>
                <CardDescription>
                  Generated on {new Date(report.created_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
