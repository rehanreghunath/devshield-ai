'use client'

import { useState } from 'react'
import { JobList } from '../components/JobList'
import { api } from '../lib/api'
import type { WebhookPayload } from '../lib/types'
import { Shield, Zap, Database, GitPullRequest, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react'

const MOCK_DIFF = `diff --git a/src/UserController.java b/src/UserController.java
index 4f2e1a3..8d92b1c 100644
--- a/src/UserController.java
+++ b/src/UserController.java
@@ -1,32 +1,45 @@
 package com.example.controller;
 
+import org.springframework.web.bind.annotation.*;
+import java.sql.*;
+
 @RestController
 public class UserController {
 
-    private DataSource ds;
+    private Connection conn;
 
-    @GetMapping("/user")
-    public User getUser(@RequestParam String id) {
-        return repo.findById(Long.parseLong(id)).orElseThrow();
+    @GetMapping("/user/{id}")
+    public User getUser(@PathVariable String userId) throws Exception {
+        String query = "SELECT * FROM users WHERE id = " + userId;
+        Statement stmt = conn.createStatement();
+        ResultSet rs = stmt.executeQuery(query);
+        log.debug("User lookup: email={}, password={}", rs.getString("email"), rs.getString("password"));
+        return mapToUser(rs);
     }
 
-    @PostMapping("/user")
-    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest req) {
-        // validate input
-        if (req.email() == null) return ResponseEntity.badRequest().build();
-        return ResponseEntity.ok(repo.save(new User(req)));
+    @PostMapping("/user")
+    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest req) {
+        // no input validation
+        User u = new User(req.name(), req.email(), req.password());
+        repo.save(u);
+        return ResponseEntity.ok(u);
     }
 }`

const MOCK_PAYLOAD: WebhookPayload = {
  repoId: 'acme-corp/payment-service',
  prNumber: 247,
  diff: MOCK_DIFF,
  prTitle: 'feat: migrate user controller to JDBC',
  author: 'dev@acme.com',
  baseBranch: 'main',
  headBranch: 'feat/jdbc-migration',
}

const STATS = [
  { label: 'Rules Loaded',   value: '10',        icon: Database,       color: 'text-brand-400'  },
  { label: 'Avg Analysis',   value: '~4s',        icon: Zap,            color: 'text-amber-400'  },
  { label: 'Tech Stack',     value: 'WebFlux',    icon: Shield,         color: 'text-violet-400' },
  { label: 'Compliance',     value: 'OWASP+SOC2', icon: GitPullRequest, color: 'text-emerald-400'},
]

export default function DashboardPage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showPayload, setShowPayload] = useState(false)

  async function handleSubmitMock() {
    setSubmitting(true)
    setSubmitMsg(null)
    try {
      const res = await api.webhooks.submit(MOCK_PAYLOAD)
      setSubmitMsg({ type: 'ok', text: `Job ${res.jobId.slice(0, 8)}… accepted` })
    } catch (err) {
      setSubmitMsg({ type: 'err', text: err instanceof Error ? err.message : 'Submission failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 badge bg-brand-500/10 text-brand-300 border border-brand-500/30 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-ring" />
          Live • RAG-Powered Compliance Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
          Code Review{' '}
          <span className="gradient-text">Command Center</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Async PR analysis powered by LangChain4j RAG — embeddings → pgvector similarity search → GPT-4o compliance review.
        </p>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center flex-shrink-0">
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-semibold text-white text-sm">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Submit mock PR ────────────────────────────────────── */}
      <div className="card mb-8 border-brand-500/20 glow-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-brand-400" />
              Submit Mock PR Webhook
            </h2>
            <p className="text-sm text-slate-400">
              Sends a realistic GitHub PR payload with a vulnerable Java diff to the analysis pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="toggle-payload-btn"
              onClick={() => setShowPayload(v => !v)}
              className="btn-ghost"
            >
              {showPayload ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showPayload ? 'Hide payload' : 'Preview payload'}
            </button>
            <button
              id="submit-mock-pr-btn"
              onClick={handleSubmitMock}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting…' : 'Trigger Analysis'}
            </button>
          </div>
        </div>

        {/* Payload preview */}
        {showPayload && (
          <div className="mt-4 code-block p-4 animate-fade-in">
            <pre className="text-xs text-slate-300 overflow-x-auto">
              {JSON.stringify({ ...MOCK_PAYLOAD, diff: MOCK_PAYLOAD.diff.slice(0, 200) + '…' }, null, 2)}
            </pre>
          </div>
        )}

        {/* Submission feedback */}
        {submitMsg && (
          <div className={`mt-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 animate-fade-in ${
            submitMsg.type === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/20 text-red-300'
          }`}>
            {submitMsg.type === 'ok' ? '✓' : '✗'} {submitMsg.text}
          </div>
        )}
      </div>

      {/* ── Job list ──────────────────────────────────────────── */}
      <JobList />
    </div>
  )
}
