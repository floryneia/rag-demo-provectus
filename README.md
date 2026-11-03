# RAG demo, Magical Chart knowledge base

A small, working retrieval-augmented generation pipeline, built to learn how vector-based RAG works end to end, using a knowledge base about my own product, Magical Chart.

## What it does

1. `ingest.js` takes a set of short facts about Magical Chart, generates vector embeddings for each one using Voyage AI, and stores them in a Postgres database (Supabase, using the pgvector extension) alongside the original text.
2. `query.js` takes a question, embeds it the same way, searches the database for the most semantically similar stored facts using cosine similarity, then sends the question plus the retrieved facts to Claude to generate an answer grounded in that context rather than in the model's general knowledge.

## Why

My existing retrieval work (in Magical Chart's AI assistant, Wooly) is structured and lexical, matching on keywords and predefined logic. This project was built to get hands-on with the vector embeddings and semantic search side of RAG, which I had not worked with in production before.

## Stack

- Voyage AI (voyage-4-lite) for embeddings
- Supabase (PostgreSQL with pgvector) for vector storage and similarity search
- Anthropic Claude for the final grounded answer

## Running it

```
npm install
# Run setup.sql once in the Supabase SQL editor first
npm run ingest
npm run query -- "your question here"
```

## Example

Question: "How does the Star Map make the sky feel grounded instead of abstract?"

The pipeline correctly retrieves the passage about the Star Map's ground-level landscape mode (similarity 0.713) ahead of less relevant passages, and Claude answers using only that retrieved context.

## Status

Isolated learning project, separate from Magical Chart's production database. Not connected to or deployed as part of the live product.
