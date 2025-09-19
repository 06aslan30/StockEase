import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Set up cache with a short TTL. Yahoo Finance data can be 15 mins delayed,
// but we poll frequently. A short cache prevents hitting the API on every single client request.
const cache = new NodeCache({ stdTTL: (process.env.POLL_INTERVAL_SECONDS || 10) - 2 });

app.use(cors());
app.use(express.json());

// --- Data Fetching Logic ---
const getQuotes = async (tickers) => {
  const cacheKey = tickers.join(',');
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`[${new Date().toISOString()}] Cache hit for: ${cacheKey}`);
    return cachedData;
  }

  console.log(`[${new Date().toISOString()}] API call for: ${cacheKey}`);
  try {
    const results = await yahooFinance.quote(tickers, {
      fields: ['regularMarketPrice', 'regularMarketChangePercent', 'longName', 'symbol', 'exchange', 'currency']
    });
    
    const quotes = results.map(q => ({
      symbol: q.symbol,
      name: q.longName,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent, // Already in percentage
      exchange: q.exchange,
      currency: q.currency,
    }));

    cache.set(cacheKey, quotes);
    return quotes;
  } catch (error) {
    console.error('Yahoo Finance API error:', error.message);
    return []; // Return empty on error
  }
};

// --- API Endpoints ---

/**
 * Simple JSON endpoint for one-time fetch (good for debugging)
 * Example: /api/quotes?tickers=TCS.NS,INFY.NS
 */
app.get('/api/quotes', async (req, res) => {
  const tickers = req.query.tickers?.split(',');
  if (!tickers || tickers.length === 0) {
    return res.status(400).json({ error: 'Tickers query parameter is required.' });
  }
  const quotes = await getQuotes(tickers);
  res.json(quotes);
});

/**
 * Server-Sent Events (SSE) endpoint for real-time updates
 * Example: /sse/prices?tickers=TCS.NS,INFY.NS
 */
app.get('/sse/prices', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const tickers = req.query.tickers?.split(',');
  if (!tickers || tickers.length === 0) {
    res.write('event: error\ndata: { "message": "No tickers provided" }\n\n');
    return;
  }

  console.log(`[SSE] Client connected for tickers: ${tickers.join(',')}`);

  const pollInterval = (process.env.POLL_INTERVAL_SECONDS || 10) * 1000;

  const intervalId = setInterval(async () => {
    const quotes = await getQuotes(tickers);
    if (quotes.length > 0) {
      // Send event to the client
      res.write(`event: prices\ndata: ${JSON.stringify(quotes)}\n\n`);
    }
  }, pollInterval);

  // Clean up when client disconnects
  req.on('close', () => {
    clearInterval(intervalId);
    console.log(`[SSE] Client disconnected for tickers: ${tickers.join(',')}`);
    res.end();
  });
});

import { createClient } from '@supabase/supabase-js';

// --- Supabase Setup ---
const supabaseUrl = 'https://tzhkoyxqklqkkpizoham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aGtveXhxa2xxa2twaXpvaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTcyNzcsImV4cCI6MjA3MzgzMzI3N30.JB2HOUOCyxmU2VsrUWVW7ZIj0VxI1h0VsFmSkK4WqVw';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- AI-Powered Advice Generation ---
const getAIAdvice = async (portfolio, liveQuotes) => {
  const prompt = `
    You are a sophisticated financial analyst AI. Your task is to provide clear, actionable, and personalized investment advice.

    **Disclaimer:** Your advice is for informational purposes only and should not be considered financial advice. Always tell the user to consult with a qualified professional before making any investment decisions.

    **User's Portfolio:**
    ${JSON.stringify(portfolio.holdings, null, 2)}

    **Latest Market Data:**
    ${JSON.stringify(liveQuotes, null, 2)}

    **Instructions:**
    1.  **Analyze the portfolio:** Briefly assess the portfolio's diversification, risk exposure, and overall health.
    2.  **Review market data:** Correlate the live market data with the user's holdings. Identify any significant price movements or trends.
    3.  **Generate specific advice:** Provide 2-3 concrete, actionable recommendations. For each recommendation, explain the reasoning based on the data.
    4.  **Provide a concluding summary:** End with a brief summary of your analysis and a concluding remark.
    5.  **IMPORTANT:** Always include the disclaimer at the end of your response.
    `;

    try {
        // This is a placeholder for a real AI model call.
        // In a real application, you would use a library like @google/generative-ai
        // to call a powerful LLM. For this example, we'll simulate the response.
        const simulatedResponse = `
        **Analysis:** Your portfolio is currently concentrated in the IT and Energy sectors, which presents a moderate risk. Diversification could be improved.

        **Recommendations:**
        1.  **Consider Trimming TCS.NS:** Your position in Tata Consultancy Services has seen a significant gain of 6%. You might consider selling a small portion to lock in profits and reduce your exposure to the IT sector.
        2.  **Diversify into Finance:** Your portfolio lacks exposure to the financial sector. Given the recent dip in HDFC Bank (-3%), this could be a good entry point to diversify your holdings.
        3.  **Hold Reliance Industries:** Reliance has shown steady growth. Continue to hold this position for long-term gains.

        **Summary:** Your portfolio is performing well but could benefit from better diversification. Consider taking some profits from your IT holdings and adding exposure to the financial sector.

        **Disclaimer:** This information is for educational purposes only and is not financial advice. Please consult with a qualified financial advisor before making any investment decisions.
        `;
        return simulatedResponse;
    } catch (error) {
        console.error('Error getting AI advice:', error);
        return 'There was an error generating advice. Please try again later.';
    }
};


app.post('/api/generate-advice', async (req, res) => {
  const { portfolio, portfolioId } = req.body; // Expect { holdings: [{ symbol: 'TCS.NS', quantity: 10 }, ...] }
  const userId = 1; // Hardcoded for MVP

  console.log('[Backend] Received request to generate advice.');
  console.log('[Backend] Portfolio:', JSON.stringify(portfolio, null, 2));

  if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
    console.error('[Backend] Portfolio data is missing or empty.');
    return res.status(400).json({ error: 'Portfolio data is required.' });
  }

  try {
    const tickers = portfolio.holdings.map(h => h.symbol);
    const liveQuotes = await getQuotes(tickers);
    console.log('[Backend] Live Quotes:', JSON.stringify(liveQuotes, null, 2));

    // Convert array to object for advice engine
    const quotesMap = liveQuotes.reduce((acc, quote) => {
      acc[quote.symbol] = quote;
      return acc;
    }, {});
    console.log('[Backend] Quotes Map for AI:', JSON.stringify(quotesMap, null, 2));

    const advice = await getAIAdvice(portfolio, quotesMap);
    console.log('[Backend] Generated AI Advice:', advice);

    // Save the report to Supabase
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          user_id: userId,
          portfolio_id: portfolioId,
          advice: advice,
          market_snapshot: quotesMap,
          portfolio_snapshot: portfolio,
        },
      ])
      .select();

    if (error) {
      console.error('[Backend] Error saving report to Supabase:', error);
      return res.status(500).json({ error: 'Failed to generate and save report.' });
    }

    console.log('[Backend] Report saved successfully:', JSON.stringify(data, null, 2));
    res.status(201).json(data);
  } catch (e) {
    console.error('[Backend] Uncaught error in /api/generate-advice:', e);
    res.status(500).json({ error: 'An unexpected error occurred on the server.' });
  }
});


app.listen(port, () => {
  console.log(`StockEase backend server listening on port ${port}`);
});
