import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";

process.env.UPLOAD_DIR = path.join(tmpdir(), "hadaf-rag-chatbot-test-uploads");

const app = createApp();

test("health endpoint reports service status", async () => {
  const res = await request(app).get("/api/health").expect(200);

  assert.equal(res.body.ok, true);
  assert.equal(res.body.service, "hadaf-rag-chatbot");
});

test("chat endpoint answers from seeded knowledge", async () => {
  const res = await request(app)
    .post("/api/chat")
    .send({ question: "What documents are required for admission?" })
    .expect(200);

  assert.match(res.body.answer, /documents|CNIC|Form-B/i);
  assert.equal(res.body.category, "admissions");
  assert.ok(res.body.confidence > 0);
  assert.ok(["local-vector", "faiss"].includes(res.body.retrievalMode));
});

test("chat endpoint rejects blank questions", async () => {
  const res = await request(app).post("/api/chat").send({ question: "" }).expect(400);

  assert.equal(res.body.error, "Question is required");
});

test("lead capture stores applicant contact details", async () => {
  const res = await request(app)
    .post("/api/chat/leads")
    .send({
      name: "Test Student",
      phone: "03000000000",
      email: "student@example.com",
      programInterest: "ICS",
      message: "Please contact me."
    })
    .expect(201);

  assert.equal(res.body.name, "Test Student");
  assert.equal(res.body.phone, "03000000000");
});

test("admin login returns token", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@hadaf.edu.pk", password: "admin12345" })
    .expect(200);

  assert.ok(res.body.token);
  assert.equal(res.body.admin.email, "admin@hadaf.edu.pk");
});

test("admin analytics requires auth and works with token", async () => {
  await request(app).get("/api/admin/analytics").expect(401);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@hadaf.edu.pk", password: "admin12345" })
    .expect(200);

  const res = await request(app)
    .get("/api/admin/analytics")
    .set("Authorization", `Bearer ${login.body.token}`)
    .expect(200);

  assert.ok(Number.isInteger(res.body.queryCount));
  assert.ok(Number.isInteger(res.body.leadCount));
  assert.ok(Number.isInteger(res.body.recentQueryCount));
  assert.ok(Array.isArray(res.body.topics));
});

test("admin can upload and delete knowledge documents", async () => {
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@hadaf.edu.pk", password: "admin12345" })
    .expect(200);

  const upload = await request(app)
    .post("/api/admin/documents")
    .set("Authorization", `Bearer ${login.body.token}`)
    .field("title", "Scholarship Policy Test")
    .field("category", "scholarships")
    .attach("file", Buffer.from("Scholarships are available for merit students and need based applicants."), "scholarships.txt")
    .expect(201);

  assert.equal(upload.body.title, "Scholarship Policy Test");
  assert.equal(upload.body.category, "scholarships");
  assert.ok(upload.body.filePath);
  assert.ok(upload.body.chunks > 0);

  await request(app)
    .delete(`/api/admin/documents/${upload.body.id}`)
    .set("Authorization", `Bearer ${login.body.token}`)
    .expect(204);
});

test("admin can export leads and query logs as csv", async () => {
  await request(app).get("/api/admin/leads.csv").expect(401);
  await request(app).get("/api/admin/queries.csv").expect(401);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@hadaf.edu.pk", password: "admin12345" })
    .expect(200);

  await request(app)
    .post("/api/chat/leads")
    .send({ name: "Export Student", phone: "03111111111", programInterest: "FSc" })
    .expect(201);

  await request(app)
    .post("/api/chat")
    .send({ question: "Which programs are offered?" })
    .expect(200);

  const leads = await request(app)
    .get("/api/admin/leads.csv")
    .set("Authorization", `Bearer ${login.body.token}`)
    .expect(200);

  assert.match(leads.headers["content-type"], /text\/csv/);
  assert.match(leads.text, /Name,Phone,Email,Program Interest,Message,Created At/);
  assert.match(leads.text, /Export Student/);

  const queries = await request(app)
    .get("/api/admin/queries.csv")
    .set("Authorization", `Bearer ${login.body.token}`)
    .expect(200);

  assert.match(queries.headers["content-type"], /text\/csv/);
  assert.match(queries.text, /Question,Category,Retrieval Score,Created At/);
  assert.match(queries.text, /Which programs are offered/);
});
