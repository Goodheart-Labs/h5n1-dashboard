/**
 * Polymarket API integration test using their Gamma API
 * Documentation: https://gamma-api.polymarket.com
 */

import axios from 'axios';

interface GammaMarket {
  id: string;
  slug: string;
  question: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  volumeNum: number;
  liquidityNum: number;
  startDate: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  [key: string]: unknown;
}

async function testPolymarketFetch() {
  const GAMMA_API = "https://gamma-api.polymarket.com";
  
  console.log("Fetching data for H5N1 State of Emergency market...");
  console.log("Market URL: https://polymarket.com/event/another-state-declare-a-state-of-emergency-over-bird-flu-before-february");
  
  try {
    // Search for our market
    console.log("\nSearching for market...");
    const response = await axios.get(
      `${GAMMA_API}/markets?active=true&order=volume&ascending=false`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (response.data?.markets) {
      const markets = response.data.markets as GammaMarket[];
      console.log(`\nFound ${markets.length} markets`);
      
      // Find our market
      const market = markets.find(m => 
        m.slug === "another-state-declare-a-state-of-emergency-over-bird-flu-before-february" ||
        (m.question.toLowerCase().includes("state of emergency") && 
         m.question.toLowerCase().includes("bird flu"))
      );
      
      if (market) {
        console.log("\nFound our market:", JSON.stringify(market, null, 2));
        
        // Get market details
        console.log("\nFetching market details...");
        const detailsResponse = await axios.get(
          `${GAMMA_API}/markets/${market.id}`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        console.log("\nMarket details:", JSON.stringify(detailsResponse.data, null, 2));
      } else {
        console.log("\nCouldn't find our market");
        
        // Log markets that might be related
        console.log("\nPossibly related markets:");
        markets
          .filter(m => 
            m.question.toLowerCase().includes("flu") || 
            m.question.toLowerCase().includes("h5n1") ||
            m.question.toLowerCase().includes("emergency")
          )
          .forEach(m => {
            console.log(`- ${m.question} (${m.slug})`);
          });
      }
    }
    
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error("\nAxios Error:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
    } else {
      const error = err as Error;
      console.error("\nError:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
}

// Run the test
testPolymarketFetch(); 