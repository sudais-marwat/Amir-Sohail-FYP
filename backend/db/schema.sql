create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_name text not null,
  file_path text,
  category text not null default 'general',
  uploaded_by uuid references admin_users(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  faq_id uuid references faqs(id) on delete cascade,
  chunk_text text not null,
  vector_id text,
  embedding jsonb,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

alter table knowledge_chunks add column if not exists embedding jsonb;

create table if not exists user_queries (
  id uuid primary key default gen_random_uuid(),
  user_question text not null,
  query_category text,
  retrieval_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists chatbot_responses (
  id uuid primary key default gen_random_uuid(),
  query_id uuid references user_queries(id) on delete cascade,
  response text not null,
  retrieved_context_reference text,
  response_time_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists admission_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  program_interest text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists analytics_records (
  id uuid primary key default gen_random_uuid(),
  query_count integer not null default 0,
  frequently_asked_topic text,
  lead_count integer not null default 0,
  date date not null default current_date
);

create index if not exists knowledge_chunks_text_idx on knowledge_chunks using gin(to_tsvector('english', chunk_text));
create index if not exists user_queries_created_idx on user_queries(created_at);
create index if not exists admission_leads_created_idx on admission_leads(created_at);

-- Default demo admin password: admin12345
insert into admin_users(name, email, password_hash, role)
values ('Hadaf Admin', 'admin@hadaf.edu.pk', '$2a$10$nCFPtOmS9bbi2F8VoDW.tuI4U3AA4sbYqbV3DysXUd7gUh7N6fPHK', 'admin')
on conflict (email) do nothing;

insert into faqs(question, answer, category, status)
select *
from (
  values
  (
    'What programs are offered at Hadaf College?',
    'Hadaf College offers intermediate programs such as F.Sc Pre-Medical, F.Sc Pre-Engineering, ICS, FA, General Science, I.Com, and selected BS and Allied Health Sciences programs where available.',
    'programs',
    'active'
  ),
  (
    'What documents are required for admission?',
    'Common admission documents include student CNIC or Form-B, parent or guardian CNIC, previous result card, photographs, character certificate, domicile or equivalence where applicable, and any scholarship proof.',
    'admissions',
    'active'
  ),
  (
    'Can students ask about scholarships?',
    'Students and parents can ask the admission team about merit scholarships, need-based concessions, sibling or kinship concessions, orphan scholarships, and Allied Schools or EFA related scholarship policies where applicable.',
    'scholarships',
    'active'
  )
) as seed(question, answer, category, status)
where not exists (
  select 1 from faqs where faqs.question = seed.question
);

insert into knowledge_chunks(faq_id, chunk_text, category)
select id, question || E'\n' || answer, category
from faqs
where not exists (
  select 1 from knowledge_chunks where knowledge_chunks.faq_id = faqs.id
);
