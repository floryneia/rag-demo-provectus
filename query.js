import 'dotenv/config';

const question = process.argv.slice(2).join(' ') || 'How does the Star Map make the sky feel grounded instead of abstract?';

async function embedQuery(text) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: [text], model: 'voyage-4-lite', input_type: 'query' })
  });
  if (!res.ok) throw new Error(`Voyage API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

async function retrieve(queryEmbedding) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/match_documents`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query_embedding: queryEmbedding, match_count: 3 })
  });
  if (!res.ok) throw new Error(`Supabase rpc error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function generate(question, context) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Answer the question using only the context below. If the context doesn't contain the answer, say so.\n\nContext:\n${context}\n\nQuestion: ${question}`
      }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text;
}

async function main() {
  console.log(`Question: ${question}\n`);

  console.log('1. Embedding the question with Voyage...');
  const queryEmbedding = await embedQuery(question);

  console.log('2. Retrieving the most similar documents from Supabase/pgvector...');
  const matches = await retrieve(queryEmbedding);
  matches.forEach((m, i) => {
    console.log(`   [${i + 1}] (similarity ${m.similarity.toFixed(3)}) ${m.content}`);
  });

  const context = matches.map(m => m.content).join('\n');

  console.log('\n3. Generating the answer with Claude, grounded in the retrieved context...');
  const answer = await generate(question, context);

  console.log('\n--- Answer ---');
  console.log(answer);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
