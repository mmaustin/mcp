import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const nws_api_base = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

async function makeNWSRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, {headers});
    if(!response.ok){
      throw new Error(`HTTP error! stats: ${response.status}.`);
    };
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  };
};

interface AlertFeature {
  properties: {
    event?: string,
    areaDesc?: string,
    severity?: string,
    status?: string,
    headline?: string
  }
};

function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "Unknown"}`,
    "---",
  ].join("\n");
};

interface ForecastPeriod {
  name?: string,
  temperature?: number,
  temperatureUnit?: string,
  windSpeed?: string,
  windDirection?: string,
  shortForecast?: string,
};

interface AlertsResponse {
  feature: AlertFeature[];
};

interface PointsResponse {
  properties: {
    forecast?: string;
  };
};

interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
};

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main();