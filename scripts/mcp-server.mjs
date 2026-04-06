import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_URL = (process.env.CERUL_API_URL || "https://api.cerul.ai").replace(
  /\/+$/,
  ""
);
const API_KEY = process.env.CERUL_API_KEY || "";

async function cerulFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${API_KEY}`,
      "content-type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cerul API error ${response.status}: ${body}`);
  }
  return response.json();
}

function formatTimestamp(seconds) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatResults(data) {
  if (!data.results || data.results.length === 0) {
    return "No results found.";
  }
  const lines = [
    `# ${data.results.length} results (${data.credits_used} credit used) | ${data.credits_remaining} credits remaining`,
    "",
  ];
  data.results.forEach((r, i) => {
    const time =
      r.timestamp_start != null
        ? `${formatTimestamp(r.timestamp_start)}-${formatTimestamp(r.timestamp_end)}`
        : "";
    lines.push(`## [${i + 1}] ${r.title}`);
    lines.push(
      `- Score: ${Math.round((r.score ?? 0) * 100)}%${time ? ` | Time: ${time}` : ""}${r.speaker ? ` | Speaker: ${r.speaker}` : ""} | Source: ${r.source}`
    );
    lines.push(`- URL: ${r.url}`);
    if (r.transcript) {
      lines.push(
        `- Transcript: ${r.transcript.length > 400 ? r.transcript.slice(0, 400) + "..." : r.transcript}`
      );
    } else if (r.snippet) {
      lines.push(`- Snippet: ${r.snippet}`);
    }
    lines.push("");
  });
  if (data.answer) {
    lines.push("## Summary", data.answer, "");
  }
  return lines.join("\n");
}

const server = new Server(
  { name: "cerul", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cerul_search",
      description:
        "Search video content by speech, visuals, and on-screen text. Use when a user asks about what someone said, wants video evidence, or needs citations from talks, podcasts, conferences, or earnings calls.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language search query",
          },
          max_results: {
            type: "number",
            description: "Number of results (1-10, default 5)",
            default: 5,
          },
          ranking_mode: {
            type: "string",
            enum: ["embedding", "rerank"],
            description:
              "embedding (fast, default) or rerank (slower, more precise)",
            default: "embedding",
          },
          include_answer: {
            type: "boolean",
            description: "Include AI-generated summary",
            default: false,
          },
          speaker: {
            type: "string",
            description: "Filter by channel/speaker name",
          },
          published_after: {
            type: "string",
            description: "Filter by date (YYYY-MM-DD)",
          },
          source: {
            type: "string",
            description: "Filter by source (e.g. youtube)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "cerul_usage",
      description: "Check remaining Cerul API credits and usage summary.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "cerul_search") {
    const body = { query: args.query, max_results: args.max_results ?? 5 };
    if (args.ranking_mode) body.ranking_mode = args.ranking_mode;
    if (args.include_answer) body.include_answer = args.include_answer;
    const filters = {};
    if (args.speaker) filters.speaker = args.speaker;
    if (args.published_after) filters.published_after = args.published_after;
    if (args.source) filters.source = args.source;
    if (Object.keys(filters).length > 0) body.filters = filters;

    const data = await cerulFetch("/v1/search", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: formatResults(data) }] };
  }

  if (name === "cerul_usage") {
    const data = await cerulFetch("/v1/usage");
    const lines = [
      `Plan: ${data.plan_code}`,
      `Credits: ${data.credits_remaining} / ${data.credits_limit} remaining`,
      `Period: ${data.period_start} — ${data.period_end}`,
      `Daily free remaining: ${data.daily_free_remaining} / ${data.daily_free_limit}`,
    ];
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
