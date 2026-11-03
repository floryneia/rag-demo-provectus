-- Run this once in the Supabase SQL Editor (Database > SQL Editor) for the rag-demo project.

create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1024),
  created_at timestamptz default now()
);

-- Allow the anon key to read/write for this throwaway demo project only.
alter table documents enable row level security;

create policy "anon can read documents"
  on documents for select
  to anon
  using (true);

create policy "anon can insert documents"
  on documents for insert
  to anon
  with check (true);

-- Similarity search function used by query.js
create or replace function match_documents (
  query_embedding vector(1024),
  match_count int default 3
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function match_documents(vector(1024), int) to anon;
