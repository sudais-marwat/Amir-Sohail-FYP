import { BarChart3, Bot, Edit3, FileText, GraduationCap, LogIn, MessageCircle, Plus, Save, Send, Trash2, Users, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { api, apiUrl, authHeaders } from "./api.js";

const prompts = [
  "Are admissions currently open?",
  "What documents are required?",
  "Which programs are offered?",
  "Are scholarships available?"
];

function cleanAssistantText(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function MessageText({ text }) {
  const blocks = cleanAssistantText(text).split(/\n{2,}/).filter(Boolean);

  return (
    <div className="message-content">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isBulletBlock = lines.length > 1 && lines.every((line) => /^-\s+/.test(line));

        if (isBulletBlock) {
          return (
            <ul key={`block-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <li key={`line-${lineIndex}`}>{line.replace(/^-\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        return lines.map((line, lineIndex) => {
          const isSectionLabel = line.length < 80 && /:$/.test(line);
          return (
            <p className={isSectionLabel ? "message-section-label" : ""} key={`line-${blockIndex}-${lineIndex}`}>
              {line}
            </p>
          );
        });
      })}
    </div>
  );
}

export function App() {
  const [view, setView] = useState("chat");

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <GraduationCap aria-hidden="true" />
          <div>
            <strong>Hadaf College</strong>
            <span>Admission Support</span>
          </div>
        </div>
        <button type="button" className={view === "chat" ? "active" : ""} onClick={() => setView("chat")}>
          <MessageCircle aria-hidden="true" /> Chatbot
        </button>
        <button type="button" className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>
          <BarChart3 aria-hidden="true" /> Admin
        </button>
      </aside>
      {view === "chat" ? <Chatbot /> : <AdminDashboard />}
    </main>
  );
}

function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Assalamualaikum. Ask me about admissions, programs, fees, scholarships, documents, hostel, transport, or student support." }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState({ name: "", phone: "", email: "", programInterest: "", message: "" });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, loading]);

  async function ask(text = question) {
    const clean = text.trim();
    if (!clean || loading) return;
    setQuestion("");
    setMessages((items) => [...items, { role: "user", text: clean }]);
    setLoading(true);
    try {
      const data = await api("/chat", { method: "POST", body: JSON.stringify({ question: clean }) });
      setMessages((items) => [...items, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setMessages((items) => [...items, { role: "assistant", text: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(event) {
    event.preventDefault();
    await api("/chat/leads", { method: "POST", body: JSON.stringify(lead) });
    setLead({ name: "", phone: "", email: "", programInterest: "", message: "Please contact me about admission." });
  }

  return (
    <section className="workspace chat-workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Student and parent support</p>
          <h1>Ask Hadaf College</h1>
        </div>
      </header>

      <div className="chat-layout">
        <section className="chat-panel" aria-label="Chat messages">
          <div className="prompt-row">
            {prompts.map((prompt) => (
              <button type="button" key={prompt} onClick={() => ask(prompt)}>{prompt}</button>
            ))}
          </div>
          <div className="messages" role="log" aria-live="polite" aria-label="Chat conversation">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                {message.role === "assistant" && <Bot aria-hidden="true" />}
                <MessageText text={message.text} />
              </div>
            ))}
            {loading && <div className="message assistant"><Bot aria-hidden="true" /><MessageText text="Checking official college information..." /></div>}
            <div ref={messagesEndRef} />
          </div>
          <form className="composer" onSubmit={(event) => { event.preventDefault(); ask(); }}>
            <label className="sr-only" htmlFor="chat-question">Admission or support question</label>
            <input id="chat-question" name="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Type your admission or support question..." autoComplete="off" />
            <button type="submit" aria-label="Send question" disabled={loading || !question.trim()}><Send aria-hidden="true" /></button>
          </form>
        </section>

        <aside className="lead-panel">
          <h2>Admission Follow-Up</h2>
          <form onSubmit={submitLead}>
            <label htmlFor="lead-name">
              <span>Full Name</span>
              <input id="lead-name" required name="name" placeholder="Full name..." autoComplete="name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
            </label>
            <label htmlFor="lead-phone">
              <span>Phone or WhatsApp</span>
              <input id="lead-phone" required type="tel" name="phone" placeholder="Phone or WhatsApp..." autoComplete="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
            </label>
            <label htmlFor="lead-email">
              <span>Email</span>
              <input id="lead-email" type="email" name="email" placeholder="Email..." autoComplete="email" spellCheck={false} value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
            </label>
            <label htmlFor="lead-program">
              <span>Program Interest</span>
              <input id="lead-program" name="programInterest" placeholder="Program interest..." autoComplete="off" value={lead.programInterest} onChange={(e) => setLead({ ...lead, programInterest: e.target.value })} />
            </label>
            <label htmlFor="lead-message">
              <span>Message</span>
              <textarea id="lead-message" name="message" placeholder="Message..." autoComplete="off" value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} />
            </label>
            <button type="submit"><Users aria-hidden="true" /> Send Details</button>
          </form>
        </aside>
      </div>
    </section>
  );
}

function AdminDashboard() {
  const [token, setToken] = useState(localStorage.getItem("hadaf_admin_token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState({ analytics: null, faqs: [], leads: [], queries: [], documents: [] });
  const [faq, setFaq] = useState({ question: "", answer: "", category: "admissions" });
  const [editingFaq, setEditingFaq] = useState(null);
  const [doc, setDoc] = useState({ title: "", category: "general", file: null });

  useEffect(() => {
    if (!token) return;
    Promise.all([api("/admin/analytics"), api("/admin/faqs"), api("/admin/leads"), api("/admin/queries"), api("/admin/documents")])
      .then(([analytics, faqs, leads, queries, documents]) => setData({ analytics, faqs, leads, queries, documents }))
      .catch(() => localStorage.removeItem("hadaf_admin_token"));
  }, [token]);

  async function login(event) {
    event.preventDefault();
    const res = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    localStorage.setItem("hadaf_admin_token", res.token);
    setToken(res.token);
  }

  async function addFaq(event) {
    event.preventDefault();
    const created = await api("/admin/faqs", { method: "POST", body: JSON.stringify({ ...faq, status: "active" }) });
    setData((current) => ({ ...current, faqs: [created, ...current.faqs] }));
    setFaq({ question: "", answer: "", category: "admissions" });
  }

  async function saveFaq(event) {
    event.preventDefault();
    const updated = await api(`/admin/faqs/${editingFaq.id}`, { method: "PUT", body: JSON.stringify(editingFaq) });
    setData((current) => ({ ...current, faqs: current.faqs.map((item) => (item.id === updated.id ? updated : item)) }));
    setEditingFaq(null);
  }

  async function deleteFaq(id) {
    await api(`/admin/faqs/${id}`, { method: "DELETE" });
    setData((current) => ({ ...current, faqs: current.faqs.filter((item) => item.id !== id) }));
  }

  async function uploadDocument(event) {
    event.preventDefault();
    if (!doc.file) return;
    const form = new FormData();
    form.append("title", doc.title || doc.file.name);
    form.append("category", doc.category);
    form.append("file", doc.file);
    const uploaded = await api("/admin/documents", { method: "POST", body: form });
    setData((current) => ({ ...current, documents: [uploaded, ...current.documents] }));
    setDoc({ title: "", category: "general", file: null });
  }

  async function deleteDocument(id) {
    await api(`/admin/documents/${id}`, { method: "DELETE" });
    setData((current) => ({ ...current, documents: current.documents.filter((item) => item.id !== id) }));
  }

  async function downloadCsv(path, filename) {
    const res = await fetch(apiUrl(path), { headers: authHeaders() });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!token) {
    return (
      <section className="workspace auth-view">
        <form className="login" onSubmit={login}>
          <LogIn aria-hidden="true" />
          <h1>Admin Login</h1>
          <label htmlFor="admin-email">
            <span>Email</span>
            <input id="admin-email" type="email" name="email" placeholder="Admin email..." autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label htmlFor="admin-password">
            <span>Password</span>
            <input id="admin-password" type="password" name="password" placeholder="Password..." autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit">Login</button>
        </form>
      </section>
    );
  }

  return (
    <section className="workspace admin-workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Knowledge base control</p>
          <h1>Admin Dashboard</h1>
        </div>
      </header>

      <div className="metrics">
        <Metric icon={<MessageCircle />} label="Queries" value={data.analytics?.queryCount ?? 0} />
        <Metric icon={<BarChart3 />} label="Last 24h" value={data.analytics?.recentQueryCount ?? 0} />
        <Metric icon={<Users />} label="Leads" value={data.analytics?.leadCount ?? 0} />
        <Metric icon={<FileText />} label="Top Topic" value={data.analytics?.topTopic ?? "general"} />
      </div>

      <div className="insight-grid">
        <section className="panel">
          <h2>Topic Breakdown</h2>
          <div className="topic-list">
            {(data.analytics?.topics || []).map((topic) => (
              <div className="topic-row" key={topic.topic}>
                <span>{topic.topic}</span>
                <div aria-hidden="true"><i style={{ width: `${Math.max(12, topic.count * 18)}px` }} /></div>
                <strong>{topic.count}</strong>
              </div>
            ))}
            {!data.analytics?.topics?.length && <p className="empty">No query topics yet.</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Recent User Queries</h2>
            <button type="button" className="small-button" onClick={() => downloadCsv("/admin/queries.csv", "hadaf-chatbot-queries.csv")}>CSV</button>
          </div>
          <div className="list compact query-list">
            {data.queries.map((item) => (
              <article key={item.id}>
                <strong>{item.user_question}</strong>
                <p>{item.query_category || "general"} - score {Number(item.retrieval_score || 0).toFixed(2)}</p>
              </article>
            ))}
            {!data.queries.length && <p className="empty">No user queries yet.</p>}
          </div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <h2>Add FAQ</h2>
          <form onSubmit={addFaq} className="stack">
            <label htmlFor="faq-question">
              <span>Question</span>
              <input id="faq-question" placeholder="Question..." value={faq.question} onChange={(e) => setFaq({ ...faq, question: e.target.value })} />
            </label>
            <label htmlFor="faq-answer">
              <span>Official Answer</span>
              <textarea id="faq-answer" placeholder="Official answer..." value={faq.answer} onChange={(e) => setFaq({ ...faq, answer: e.target.value })} />
            </label>
            <label htmlFor="faq-category">
              <span>Category</span>
              <input id="faq-category" placeholder="Category..." value={faq.category} onChange={(e) => setFaq({ ...faq, category: e.target.value })} />
            </label>
            <button type="submit"><Plus aria-hidden="true" /> Add FAQ</button>
          </form>
        </section>

        <section className="panel">
          <h2>Recent FAQs</h2>
          {editingFaq && (
            <form onSubmit={saveFaq} className="stack editor">
              <label htmlFor="edit-faq-question">
                <span>Question</span>
                <input id="edit-faq-question" value={editingFaq.question} onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })} />
              </label>
              <label htmlFor="edit-faq-answer">
                <span>Official Answer</span>
                <textarea id="edit-faq-answer" value={editingFaq.answer} onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })} />
              </label>
              <label htmlFor="edit-faq-category">
                <span>Category</span>
                <input id="edit-faq-category" value={editingFaq.category} onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })} />
              </label>
              <div className="button-row">
                <button type="submit"><Save aria-hidden="true" /> Save</button>
                <button type="button" className="secondary" onClick={() => setEditingFaq(null)}><X aria-hidden="true" /> Cancel</button>
              </div>
            </form>
          )}
          <div className="list">
            {data.faqs.map((item) => (
              <article key={item.id}>
                <div className="item-header">
                  <strong>{item.question}</strong>
                  <span>
                    <button type="button" className="icon-button" title="Edit FAQ" onClick={() => setEditingFaq(item)}><Edit3 aria-hidden="true" /></button>
                    <button type="button" className="icon-button danger" title="Delete FAQ" onClick={() => deleteFaq(item.id)}><Trash2 aria-hidden="true" /></button>
                  </span>
                </div>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Documents</h2>
          <form onSubmit={uploadDocument} className="stack upload-form">
            <label htmlFor="doc-title">
              <span>Document Title</span>
              <input id="doc-title" placeholder="Document title..." value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
            </label>
            <label htmlFor="doc-category">
              <span>Category</span>
              <input id="doc-category" placeholder="Category..." value={doc.category} onChange={(e) => setDoc({ ...doc, category: e.target.value })} />
            </label>
            <label htmlFor="doc-file">
              <span>Document File</span>
              <input id="doc-file" type="file" accept=".txt,.md,.pdf,.docx" onChange={(e) => setDoc({ ...doc, file: e.target.files?.[0] || null })} />
            </label>
            <button type="submit"><FileText aria-hidden="true" /> Upload Document</button>
          </form>
          <div className="list compact">
            {data.documents.map((item) => (
              <article key={item.id}>
                <div className="item-header">
                  <strong>{item.title}</strong>
                  <button type="button" className="icon-button danger" title="Delete document" onClick={() => deleteDocument(item.id)}><Trash2 aria-hidden="true" /></button>
                </div>
                <p>{item.category || item.document_category || "general"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Admission Leads</h2>
            <button type="button" className="small-button" onClick={() => downloadCsv("/admin/leads.csv", "hadaf-admission-leads.csv")}>CSV</button>
          </div>
          <div className="list compact">
            {data.leads.map((item) => <article key={item.id}><strong>{item.name}</strong><p>{item.phone} - {item.program_interest || item.programInterest || "Program not specified"}</p></article>)}
          </div>
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

