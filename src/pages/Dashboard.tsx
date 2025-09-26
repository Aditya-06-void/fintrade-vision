import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CompanyData {
  "Global Quote": {
    "01. symbol": string;
    "02. open": string;
    "03. high": string;
    "04. low": string;
    "05. price": string;
    "06. volume": string;
    "07. latest trading day": string;
    "08. previous close": string;
    "09. change": string;
    "10. change percent": string;
  };
}

interface HistoricalData {
  "Meta Data": any;
  "Time Series (5min)": Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
}

export default function Dashboard() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch company quote
        const quoteResponse = await fetch('https://fintra-efqj.onrender.com/company-quote/IBM');
        const quoteData = await quoteResponse.json();
        setCompanyData(quoteData);

        // Fetch historical data
        const historicalResponse = await fetch('https://fintra-efqj.onrender.com/company-intraday/IBM?interval=5min');
        const historicalData = await historicalResponse.json();
        
        if (historicalData["Time Series (5min)"]) {
          const chartData = Object.entries(historicalData["Time Series (5min)"])
            .slice(0, 50)
            .map(([timestamp, data]: [string, any]) => ({
              time: timestamp,
              price: parseFloat(data["4. close"]),
            }))
            .reverse();
          
          setHistoricalData(chartData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading stock data...</div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Failed to load stock data</div>
      </div>
    );
  }

  const quote = companyData["Global Quote"];
  const isPositive = parseFloat(quote["09. change"]) >= 0;

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quote["01. symbol"]}</h1>
          <p className="text-muted-foreground">International Business Machines Corporation</p>
        </div>
        <Badge variant={isPositive ? "default" : "destructive"}>
          {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          {quote["10. change percent"]}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(quote["05. price"]).toFixed(2)}</div>
            <p className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {quote["09. change"]} ({quote["10. change percent"]})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(quote["02. open"]).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High / Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              ${parseFloat(quote["03. high"]).toFixed(2)} / ${parseFloat(quote["04. low"]).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseInt(quote["06. volume"]).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Chart (5-minute intervals)</CardTitle>
          <CardDescription>
            Latest trading day: {quote["07. latest trading day"]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-md">
                          <p className="font-medium">
                            {new Date(label).toLocaleString()}
                          </p>
                          <p className="text-primary">
                            Price: ${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Previous Close:</span>
            <span>${parseFloat(quote["08. previous close"]).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Latest Trading Day:</span>
            <span>{quote["07. latest trading day"]}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}