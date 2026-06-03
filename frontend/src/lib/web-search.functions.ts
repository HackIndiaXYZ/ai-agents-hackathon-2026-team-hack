import { createServerFn } from "@tanstack/react-start";

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    if (!data?.query || typeof data.query !== "string") {
      throw new Error("query is required");
    }
    return { query: data.query.slice(0, 500) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) throw new Error("SERPER_API_KEY is not configured");

    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: data.query, num: 5 }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Serper API failed [${res.status}]: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      organic?: Array<{ title?: string; link?: string; snippet?: string }>;
      answerBox?: { answer?: string; snippet?: string; title?: string } | null;
    };

    const results: SerperResult[] = (json.organic ?? []).slice(0, 5).map((r) => ({
      title: r.title ?? "Untitled",
      link: r.link ?? "",
      snippet: r.snippet ?? "",
    }));

    const answer =
      json.answerBox?.answer ?? json.answerBox?.snippet ?? null;

    return { query: data.query, results, answer };
  });
