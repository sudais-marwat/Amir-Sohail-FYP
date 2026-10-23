import { ArrowRight, Award, BarChart3, Bot, BookOpen, ClipboardCheck, Edit3, FileText, GraduationCap, LogIn, MessageCircle, Bus, Menu, Plus, RotateCcw, Save, Send, Sparkles, Trash2, Users, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { api, apiUrl, authHeaders, warmUp } from "./api.js";

const prompts = [
  { text: "Are admissions currently open?", icon: ClipboardCheck },
  { text: "What documents are required?", icon: FileText },
  { text: "Which programs are offered?", icon: BookOpen },
  { text: "Are scholarships available?", icon: Award }
];

const capabilities = [
  { label: "Admissions & deadlines", icon: ClipboardCheck },
  { label: "Programs & courses", icon: BookOpen },
  { label: "Fees & scholarships", icon: Award },
  { label: "Documents required", icon: FileText },
  { label: "Hostel & transport", icon: Bus }
];

function cleanAssistantText(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatTime(value) {
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function MessageText({ text }) {
  const blocks = cleanAssistantText(text).split(/\n{2,}/).filter(Boolean);

  return (
    <div className="bubble-text">
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
            <p className={isSectionLabel ? "section-label" : ""} key={`line-${blockIndex}-${lineIndex}`}>
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
  const [navOpen, setNavOpen] = useState(false);

  function go(next) {
    setView(next);
    setNavOpen(false);
  }

  return (
    <div className={`app ${navOpen ? "nav-open" : ""}`}>
      <button type="button" className="scrim" aria-label="Close menu" onClick={() => setNavOpen(false)} />

      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo"><GraduationCap aria-hidden="true" /></span>
          <div className="sidebar-brand-text">
            <strong>Hadaf College</strong>
            <span>Admission Assistant</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Primary">
          <button type="button" className={view === "chat" ? "active" : ""} onClick={() => go("chat")}>
            <MessageCircle aria-hidden="true" /><span>Chat Assistant</span>
          </button>
          <button type="button" className={view === "admin" ? "active" : ""} onClick={() => go("admin")}>
            <BarChart3 aria-hidden="true" /><span>Admin Dashboard</span>
          </button>
        </nav>

        <div className="side-section">
          <p className="side-section-title">What I can help with</p>
          <ul className="capability-list">
            {capabilities.map(({ label, icon: Icon }) => (
              <li key={label}><Icon aria-hidden="true" /><span>{label}</span></li>
            ))}
          </ul>
        </div>

        <div className="sidebar-foot">
          <span className="dot" aria-hidden="true" />
          <span>AI assistant · Online 24/7</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button type="button" className="menu-btn" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <Menu aria-hidden="true" />
          </button>
          <span className="topbar-brand">Hadaf College</span>
        </header>
        <main className="app-main">
          {view === "chat" ? <Chatbot /> : <AdminDashboard />}
        </main>
      </div>
    </div>
  );
}

function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Assalamualaikum! I'm the Hadaf College assistant. Ask me anything about admissions, programs, fees, scholarships, documents, hostel, or transport.", at: Date.now() }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const messagesEndRef = useRef(null);

  const started = messages.length > 1 || loading;

  function newChat() {
    setMessages((items) => items.slice(0, 1));
    setQuestion("");
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, loading]);

  // Wake a possibly-sleeping backend as soon as the page loads.
  useEffect(() => {
    warmUp();
  }, []);

  async function ask(text = question) {
    const clean = text.trim();
    if (!clean || loading) return;
    setQuestion("");
    setMessages((items) => [...items, { role: "user", text: clean, at: Date.now() }]);
    setLoading(true);
    const slowTimer = setTimeout(() => setSlow(true), 7000);
    try {
      const data = await api("/chat", { method: "POST", body: JSON.stringify({ question: clean }) });
      setMessages((items) => [...items, { role: "assistant", text: data.answer, at: Date.now() }]);
    } catch (err) {
      setMessages((items) => [...items, { role: "assistant", text: err.message, at: Date.now() }]);
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setLoading(false);
    }
  }

  return (
    <div className="chat">
      <header className="chat-head">
        <div className="assistant-id">
          <span className="assistant-avatar"><Bot aria-hidden="true" /></span>
          <div>
            <strong>Hadaf Assistant</strong>
            <span className="assistant-status"><i aria-hidden="true" /> Online · replies in seconds</span>
          </div>
        </div>
        {started && (
          <button type="button" className="ghost-btn" title="Start a new chat" onClick={newChat}>
            <RotateCcw aria-hidden="true" /><span>New chat</span>
          </button>
        )}
      </header>

      <div className="messages" role="log" aria-live="polite" aria-label="Chat conversation">
        <div className="messages-inner">
          {!started ? (
            <div className="welcome">
              <span className="welcome-avatar"><Sparkles aria-hidden="true" /></span>
              <h2>How can I help you today?</h2>
              <p>Ask me anything about admissions, programs, fees, scholarships, documents, hostel, or transport.</p>
              <div className="suggestions">
                {prompts.map(({ text, icon: Icon }) => (
                  <button type="button" key={text} onClick={() => ask(text)}>
                    <span className="sugg-icon"><Icon aria-hidden="true" /></span>
                    <span className="sugg-text">{text}</span>
                    <ArrowRight className="sugg-arrow" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div className={`msg ${message.role}`} key={`${message.role}-${index}`}>
                  {message.role === "assistant" && <span className="msg-avatar"><Bot aria-hidden="true" /></span>}
                  <div className="msg-body">
                    <div className="bubble"><MessageText text={message.text} /></div>
                    {message.at && <time className="msg-time" dateTime={new Date(message.at).toISOString()}>{formatTime(message.at)}</time>}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="msg assistant">
                  <span className="msg-avatar"><Bot aria-hidden="true" /></span>
                  <div className="msg-body">
                    <div className="bubble typing" aria-label="Assistant is typing">
                      <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
                      <span className="sr-only">Checking official college information</span>
                    </div>
                    {slow && <span className="msg-time">Waking up the assistant — this can take a moment…</span>}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="composer" onSubmit={(event) => { event.preventDefault(); ask(); }}>
        <div className="composer-inner">
          <label className="sr-only" htmlFor="chat-question">Admission or support question</label>
          <input id="chat-question" name="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about admissions, programs, fees, scholarships…" autoComplete="off" />
          <button type="submit" aria-label="Send question" disabled={loading || !question.trim()}><Send aria-hidden="true" /></button>
        </div>
        <p className="composer-foot">Hadaf Assistant can make mistakes — please confirm important details with the admission office.</p>
      </form>
    </div>
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
      <div className="auth-view">
        <form className="login" onSubmit={login}>
          <span className="login-badge"><LogIn aria-hidden="true" /></span>
          <h1>Admin sign in</h1>
          <p className="login-sub">Manage the knowledge base, documents, and leads.</p>
          <label htmlFor="admin-email">
            <span>Email</span>
            <input id="admin-email" type="email" name="email" placeholder="admin@email.com" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label htmlFor="admin-password">
            <span>Password</span>
            <input id="admin-password" type="password" name="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit" className="primary-btn">Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin-head">
        <p className="eyebrow">Knowledge base control</p>
        <h1>Admin Dashboard</h1>
        <p className="admin-sub">Manage FAQs and documents, review leads, and see what students are asking.</p>
      </header>

      <div className="metrics">
        <Metric icon={<MessageCircle />} label="Total queries" value={data.analytics?.queryCount ?? 0} />
        <Metric icon={<BarChart3 />} label="Last 24 hours" value={data.analytics?.recentQueryCount ?? 0} />
        <Metric icon={<Users />} label="Leads" value={data.analytics?.leadCount ?? 0} />
        <Metric icon={<FileText />} label="Top topic" value={data.analytics?.topTopic ?? "general"} />
      </div>

      <div className="insight-grid">
        <section className="panel">
          <h2>Topic breakdown</h2>
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
            <h2>Recent user queries</h2>
            <button type="button" className="small-button" onClick={() => downloadCsv("/admin/queries.csv", "hadaf-chatbot-queries.csv")}>Export CSV</button>
          </div>
          <div className="list compact query-list">
            {data.queries.map((item) => (
              <article key={item.id}>
                <strong>{item.user_question}</strong>
                <p>{item.query_category || "general"} · score {Number(item.retrieval_score || 0).toFixed(2)}</p>
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
              <input id="faq-question" placeholder="Question…" value={faq.question} onChange={(e) => setFaq({ ...faq, question: e.target.value })} />
            </label>
            <label htmlFor="faq-answer">
              <span>Official answer</span>
              <textarea id="faq-answer" placeholder="Official answer…" value={faq.answer} onChange={(e) => setFaq({ ...faq, answer: e.target.value })} />
            </label>
            <label htmlFor="faq-category">
              <span>Category</span>
              <input id="faq-category" placeholder="Category…" value={faq.category} onChange={(e) => setFaq({ ...faq, category: e.target.value })} />
            </label>
            <button type="submit" className="primary-btn"><Plus aria-hidden="true" /> Add FAQ</button>
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
                <span>Official answer</span>
                <textarea id="edit-faq-answer" value={editingFaq.answer} onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })} />
              </label>
              <label htmlFor="edit-faq-category">
                <span>Category</span>
                <input id="edit-faq-category" value={editingFaq.category} onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })} />
              </label>
              <div className="button-row">
                <button type="submit" className="primary-btn"><Save aria-hidden="true" /> Save</button>
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
              <span>Document title</span>
              <input id="doc-title" placeholder="Document title…" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
            </label>
            <label htmlFor="doc-category">
              <span>Category</span>
              <input id="doc-category" placeholder="Category…" value={doc.category} onChange={(e) => setDoc({ ...doc, category: e.target.value })} />
            </label>
            <label htmlFor="doc-file">
              <span>Document file</span>
              <input id="doc-file" type="file" accept=".txt,.md,.pdf,.docx" onChange={(e) => setDoc({ ...doc, file: e.target.files?.[0] || null })} />
            </label>
            <button type="submit" className="primary-btn"><FileText aria-hidden="true" /> Upload document</button>
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
            <h2>Admission leads</h2>
            <button type="button" className="small-button" onClick={() => downloadCsv("/admin/leads.csv", "hadaf-admission-leads.csv")}>Export CSV</button>
          </div>
          <div className="list compact">
            {data.leads.map((item) => <article key={item.id}><strong>{item.name}</strong><p>{item.phone} · {item.program_interest || item.programInterest || "Program not specified"}</p></article>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      <span className="metric-icon">{icon}</span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
