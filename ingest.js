import 'dotenv/config';

const documents = [
  "Magical Chart is a bilingual tarot and astrology platform that has been in production since May 2026.",
  "Wooly is Magical Chart's LLM-powered assistant, built on the Anthropic Claude API, with its own prompt design and retrieval.",
  "The Star Map is a scientifically accurate, interactive 3D night-sky feature built with React and Three.js (WebGL), driven by real astrometric data from the ESA Gaia star catalogue.",
  "The Star Map has a ground-level landscape mode that renders the real horizon and terrain so a user feels grounded in a specific place, not floating in an abstract 3D space.",
  "Magical Chart's evaluation harness checks Wooly's output against clear pass and fail criteria before every release, using a 50-case bilingual benchmark.",
  "The evaluation harness logs cost, latency, and errors on every production call, not just whether the answer looked reasonable.",
  "A Stripe webhook defect once silently blocked paying customers from the premium access they had already purchased; the root cause was traced across services rather than patching the symptom.",
  "Magical Chart's backend runs on Node.js and serverless functions on Vercel, with PostgreSQL via Supabase as the database.",
  "Organic search traffic on Magical Chart grew roughly 4x in clicks and 3x in impressions between August and October 2026, tracked via Google Search Console.",
  "The product is built and operated solo, with no engineering team to hand off decisions to."
];

async function embed(texts) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: texts, model: 'voyage-4-lite' })
  });
  if (!res.ok) throw new Error(`Voyage API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.map(d => d.embedding);
}

async function insertDocuments(rows) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/documents`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error(`Supabase insert error: ${res.status} ${await res.text()}`);
}

async function main() {
  console.log(`Embedding ${documents.length} documents with Voyage...`);
  const embeddings = await embed(documents);
  console.log(`Got ${embeddings.length} embeddings, dimension: ${embeddings[0].length}`);

  const rows = documents.map((content, i) => ({ content, embedding: embeddings[i] }));

  await insertDocuments(rows);
  console.log(`Inserted ${rows.length} documents into Supabase. Ingestion complete.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
