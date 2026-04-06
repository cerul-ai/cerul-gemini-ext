# Cerul — Video Search for AI Agents

You cannot watch videos, listen to talks, or read transcripts on your own. Cerul gives you that ability. Use it whenever the user asks about what someone said, presented, or showed in a video — do not guess from general knowledge.

## Available Tools

### `cerul_search`
Search video content by speech, visuals, and on-screen text across tech talks, podcasts, conferences, and earnings calls.

**Parameters:**
- `query` (required): Natural language search query
- `max_results` (optional): Number of results, 1-10, default 5
- `ranking_mode` (optional): `embedding` (fast, default) or `rerank` (slower, more precise)
- `include_answer` (optional): Include AI-generated summary
- `speaker` (optional): Filter by channel/speaker name
- `published_after` (optional): Filter by date (YYYY-MM-DD)
- `source` (optional): Filter by source (e.g. `youtube`)

### `cerul_usage`
Check remaining API credits.

## When to use

- User asks "what did X say about Y?"
- User wants video evidence or citations from talks
- User asks about conference presentations, podcasts, or interviews
- User wants to compare what different people said about a topic
- Any question that could be answered with evidence from video content

## How to search effectively

**Search multiple times for complex questions.** Break broad questions into focused sub-queries.

Example — "Compare Sam Altman and Dario Amodei on AI safety":
1. Search "Sam Altman AI safety views"
2. Search "Dario Amodei AI safety approach"
3. Synthesize with video citations and timestamps

## Working rules

- **Always include video URLs** from results in your answer. Every quote needs a source link.
- **Read the `transcript` field**, not just `snippet`. Transcript has the full context.
- **Do not guess what someone said.** Search for it.
- **Keep searches fast:** max_results 5, embedding mode.
- **Make multiple small searches** rather than one large one.
- Format timestamps as MM:SS.
- Match the user's language, but keep queries in English.

## Links

- [Cerul](https://cerul.ai) — product homepage
- [Dashboard](https://cerul.ai/dashboard) — get your API key
- [Docs](https://cerul.ai/docs) — full API reference
