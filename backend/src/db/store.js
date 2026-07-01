import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";
import { v4 as uuid } from "uuid";
import { chunkText } from "../services/chunker.js";
import { embedText } from "../services/embeddings.js";

const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

function parseEmbedding(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return JSON.parse(value);
  return null;
}

const memory = {
  admins: [],
  faqs: [
    {
      id: uuid(),
      question: "What programs are offered at Hadaf College?",
      answer: "Hadaf College offers intermediate programs such as F.Sc Pre-Medical, F.Sc Pre-Engineering, ICS, FA, General Science, I.Com, and selected BS and Allied Health Sciences programs where available.",
      category: "programs",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuid(),
      question: "What documents are required for admission?",
      answer: "Common admission documents include student CNIC or Form-B, parent or guardian CNIC, previous result card, photographs, character certificate, domicile or equivalence where applicable, and any scholarship proof.",
      category: "admissions",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuid(),
      question: "Can students ask about scholarships?",
      answer: "Students and parents can ask the admission team about merit scholarships, need-based concessions, sibling or kinship concessions, orphan scholarships, and Allied Schools or EFA related scholarship policies where applicable.",
      category: "scholarships",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  documents: [],
  chunks: [],
  queries: [],
  responses: [],
  leads: []
};

async function seedAdmin() {
  if (pool) return;
  if (memory.admins.length) return;
  memory.admins.push({
    id: uuid(),
    name: "Hadaf Admin",
    email: process.env.ADMIN_EMAIL || "admin@hadaf.edu.pk",
    password_hash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin12345", 10),
    role: "admin",
    created_at: new Date().toISOString()
  });
}

async function seedKnowledge() {
  if (pool) return;
  if (memory.chunks.length) return;

  for (const faq of memory.faqs) {
    const text = `${faq.question}\n${faq.answer}`;
    memory.chunks.push({
      id: uuid(),
      faq_id: faq.id,
      chunk_text: text,
      category: faq.category,
      embedding: await embedText(text),
      created_at: new Date().toISOString()
    });
  }

  const seedPath = path.resolve("seeds/questions-knowledge.txt");
  const text = await readFile(seedPath, "utf8").catch(() => "");
  if (text) {
    const doc = {
      id: uuid(),
      title: "Questions.xlsx Knowledge",
      fileName: "questions-knowledge.txt",
      filePath: seedPath,
      category: "official-questions",
      uploaded_at: new Date().toISOString()
    };
    memory.documents.push(doc);
    for (const chunk of chunkText(text, 1200, 160)) {
      memory.chunks.push({
        id: uuid(),
        document_id: doc.id,
        chunk_text: chunk,
        category: doc.category,
        embedding: await embedText(chunk),
        created_at: new Date().toISOString()
      });
    }
  }
}

await seedAdmin();
await seedKnowledge();

export const store = {
  async findAdminByEmail(email) {
    if (pool) {
      const { rows } = await pool.query("select * from admin_users where email = $1", [email]);
      return rows[0];
    }
    return memory.admins.find((admin) => admin.email === email);
  },

  async listFaqs() {
    if (pool) {
      const { rows } = await pool.query("select * from faqs order by created_at desc");
      return rows;
    }
    return [...memory.faqs].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createFaq(input) {
    if (pool) {
      const { rows } = await pool.query(
        "insert into faqs(question, answer, category, status) values($1,$2,$3,$4) returning *",
        [input.question, input.answer, input.category || "general", input.status || "active"]
      );
      if (input.embedding) {
        await pool.query(
          "insert into knowledge_chunks(faq_id, chunk_text, category, embedding) values($1,$2,$3,$4)",
          [rows[0].id, `${rows[0].question}\n${rows[0].answer}`, rows[0].category, JSON.stringify(input.embedding)]
        );
      }
      return rows[0];
    }
    const item = { id: uuid(), status: "active", category: "general", ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    memory.faqs.push(item);
    memory.chunks.push({ id: uuid(), faq_id: item.id, chunk_text: `${item.question}\n${item.answer}`, category: item.category, embedding: input.embedding, created_at: new Date().toISOString() });
    return item;
  },

  async updateFaq(id, input) {
    if (pool) {
      const { rows } = await pool.query(
        "update faqs set question=$1, answer=$2, category=$3, status=$4, updated_at=now() where id=$5 returning *",
        [input.question, input.answer, input.category, input.status, id]
      );
      if (rows[0]) {
        await pool.query("delete from knowledge_chunks where faq_id=$1", [id]);
        if (input.status === "active") {
          await pool.query(
            "insert into knowledge_chunks(faq_id, chunk_text, category, embedding) values($1,$2,$3,$4)",
            [id, `${input.question}\n${input.answer}`, input.category || "general", JSON.stringify(input.embedding || [])]
          );
        }
      }
      return rows[0];
    }
    const item = memory.faqs.find((faq) => faq.id === id);
    if (!item) return null;
    Object.assign(item, input, { updated_at: new Date().toISOString() });
    memory.chunks = memory.chunks.filter((chunk) => chunk.faq_id !== id);
    if (item.status === "active") {
      memory.chunks.push({ id: uuid(), faq_id: id, chunk_text: `${item.question}\n${item.answer}`, category: item.category, embedding: input.embedding, created_at: new Date().toISOString() });
    }
    return item;
  },

  async deleteFaq(id) {
    if (pool) {
      await pool.query("delete from faqs where id=$1", [id]);
      return;
    }
    memory.faqs = memory.faqs.filter((faq) => faq.id !== id);
    memory.chunks = memory.chunks.filter((chunk) => chunk.faq_id !== id);
  },

  async addDocument(input, chunks) {
    if (pool) {
      const { rows } = await pool.query(
        "insert into documents(title, file_name, file_path, category, uploaded_by) values($1,$2,$3,$4,$5) returning *",
        [input.title, input.fileName, input.filePath, input.category || "general", input.uploadedBy || null]
      );
      const doc = rows[0];
      for (const chunk of chunks) {
        await pool.query(
          "insert into knowledge_chunks(document_id, chunk_text, category, embedding) values($1,$2,$3,$4)",
          [doc.id, chunk.text, doc.category, JSON.stringify(chunk.embedding || [])]
        );
      }
      return doc;
    }
    const doc = { id: uuid(), ...input, uploaded_at: new Date().toISOString() };
    memory.documents.push(doc);
    chunks.forEach((chunk) => memory.chunks.push({ id: uuid(), document_id: doc.id, chunk_text: chunk.text, embedding: chunk.embedding, category: doc.category || "general", created_at: new Date().toISOString() }));
    return doc;
  },

  async getDocument(id) {
    if (pool) {
      const { rows } = await pool.query("select * from documents where id=$1", [id]);
      return rows[0];
    }
    return memory.documents.find((document) => document.id === id);
  },

  async deleteDocument(id) {
    if (pool) {
      await pool.query("delete from documents where id=$1", [id]);
      return;
    }
    memory.documents = memory.documents.filter((document) => document.id !== id);
    memory.chunks = memory.chunks.filter((chunk) => chunk.document_id !== id);
  },

  async listDocuments() {
    if (pool) {
      const { rows } = await pool.query("select * from documents order by uploaded_at desc");
      return rows;
    }
    return memory.documents;
  },

  async knowledgeChunks() {
    if (pool) {
      const chunkRows = await pool.query("select id, faq_id, document_id, chunk_text, category, embedding from knowledge_chunks");
      return chunkRows.rows.map((row) => ({
        ...row,
        embedding: parseEmbedding(row.embedding)
      }));
    }
    return memory.chunks;
  },

  async logConversation({ question, category, score, answer, contextRef, responseTime }) {
    if (pool) {
      const query = await pool.query(
        "insert into user_queries(user_question, query_category, retrieval_score) values($1,$2,$3) returning *",
        [question, category, score]
      );
      await pool.query(
        "insert into chatbot_responses(query_id, response, retrieved_context_reference, response_time_ms) values($1,$2,$3,$4)",
        [query.rows[0].id, answer, contextRef, responseTime]
      );
      return query.rows[0];
    }
    const query = { id: uuid(), user_question: question, query_category: category, retrieval_score: score, created_at: new Date().toISOString() };
    memory.queries.push(query);
    memory.responses.push({ id: uuid(), query_id: query.id, response: answer, retrieved_context_reference: contextRef, response_time_ms: responseTime, created_at: new Date().toISOString() });
    return query;
  },

  async createLead(input) {
    if (pool) {
      const { rows } = await pool.query(
        "insert into admission_leads(name, phone, email, program_interest, message) values($1,$2,$3,$4,$5) returning *",
        [input.name, input.phone, input.email, input.programInterest, input.message]
      );
      return rows[0];
    }
    const lead = { id: uuid(), ...input, created_at: new Date().toISOString() };
    memory.leads.push(lead);
    return lead;
  },

  async analytics() {
    if (pool) {
      const queries = await pool.query("select count(*)::int as total from user_queries");
      const leads = await pool.query("select count(*)::int as total from admission_leads");
      const top = await pool.query("select query_category, count(*) from user_queries group by query_category order by count desc limit 1");
      const topics = await pool.query("select coalesce(query_category, 'general') as topic, count(*)::int as count from user_queries group by topic order by count desc limit 6");
      const recent = await pool.query("select count(*)::int as total from user_queries where created_at >= now() - interval '24 hours'");
      return {
        queryCount: queries.rows[0].total,
        leadCount: leads.rows[0].total,
        topTopic: top.rows[0]?.query_category || "general",
        recentQueryCount: recent.rows[0].total,
        topics: topics.rows
      };
    }
    const topicCounts = memory.queries.reduce((counts, query) => {
      const topic = query.query_category || "general";
      counts[topic] = (counts[topic] || 0) + 1;
      return counts;
    }, {});
    const topics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return {
      queryCount: memory.queries.length,
      leadCount: memory.leads.length,
      topTopic: topics[0]?.topic || "admissions",
      recentQueryCount: memory.queries.filter((query) => new Date(query.created_at).getTime() >= yesterday).length,
      topics
    };
  },

  async listLeads() {
    if (pool) {
      const { rows } = await pool.query("select * from admission_leads order by created_at desc");
      return rows;
    }
    return memory.leads;
  },

  async listQueries() {
    if (pool) {
      const { rows } = await pool.query("select * from user_queries order by created_at desc limit 100");
      return rows;
    }
    return memory.queries;
  }
};
