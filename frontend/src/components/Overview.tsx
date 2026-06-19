import { CheckCircle2, AlertCircle, Search, Shield } from 'lucide-react';

export default function Overview() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-800/50 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-slate-100 mb-4">Fleet Intelligence</h1>
        <p className="text-xl text-slate-300 mb-4">
          From filing cabinets and glove boxes to a searchable, queryable fleet database.
        </p>
        <p className="text-slate-400">
          50+ documents per week. Zero hallucinations. Grounded in 230 real fleet documents.
        </p>
      </div>

      {/* The Problem */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <AlertCircle className="text-red-400" />
          The Problem
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-3">
          <p className="text-slate-300 leading-relaxed">
            Trucking carriers run entirely on paper. Every week generates:
          </p>
          <ul className="space-y-2 text-slate-400 ml-4">
            <li>✓ Fuel receipts (varying formats from dozens of vendors)</li>
            <li>✓ Maintenance invoices (different shops, different systems)</li>
            <li>✓ Insurance certificates (annual renewals)</li>
            <li>✓ Tax forms (Form 2290, quarterly filings)</li>
            <li>✓ Vehicle titles and registrations</li>
            <li>✓ DOT inspections (with compliance status)</li>
            <li>✓ Settlement statements (driver settlements, load reconciliation)</li>
            <li>✓ Emails (dispatch notes, supplier communications)</li>
            <li>✓ Toll receipts (transponder transactions)</li>
          </ul>
          <p className="text-slate-300 mt-4 font-semibold">
            Result: Nothing is searchable. Nothing is organized by truck. Operators can't answer basic questions:
          </p>
          <ul className="space-y-2 text-slate-400 ml-4 text-sm">
            <li>❌ "Which trucks are profitable this month?"</li>
            <li>❌ "How much did we spend on parts last month?"</li>
            <li>❌ "Where's the tax form for truck 84?"</li>
            <li>❌ "Which documents need renewal this week?"</li>
          </ul>
        </div>
      </section>

      {/* The Solution */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-green-400" />
          Our Solution: 5-Module Architecture
        </h2>

        <div className="space-y-4">
          {/* Module 3 */}
          <Module
            number={3}
            title="Document Ingestion Pipeline"
            status="✅ Complete"
            description="Every document is automatically classified, fields extracted, truck references resolved, and stored."
            flow="Scan → Classify → Extract → Resolve Truck → Store in SQLite + ChromaDB"
            example="Fuel receipt: 'Truck Trk 84' → classified as fuel_receipt → extracted {truck: 84, amount: 539.32} → resolved to T-084 → stored"
            stats="230 documents, 10 document types, 10 truck entities, 1,150+ linked documents"
          />

          {/* Module 2 */}
          <Module
            number={2}
            title="Entity Resolution Engine"
            status="📋 To Build"
            description="The same truck appears as 'Unit 84', 'Trk 84', 'T-084', '84' in different documents. Module 2 maps all to canonical T-084."
            flow="Messy Mention → Normalize → Match Rules → Confidence Score"
            example="'Trk 84' → matches 'Trk' pattern → normalize to T-084 → 0.90 confidence"
            stats="7 resolution rules, confidence scores 0.6-1.0, embedding fallback"
          />

          {/* Module 1 */}
          <Module
            number={1}
            title="MCP Data Server (Security Boundary)"
            status="📋 To Build"
            description="LLM never touches the database directly. 7 typed tools handle all queries server-side."
            flow="LLM generates tool call → MCP validates params → runs query → returns structured result"
            example="User: 'How much on parts?' → LLM: {tool: get_expenses, params: {category: parts}} → returns $2,287.50"
            stats="7 tools, typed Pydantic validation, audit logging, zero SQL injection risk"
          />

          {/* Module 4 */}
          <Module
            number={4}
            title="AI Agent (Planner + Formatter)"
            status="📋 To Build"
            description="Converts plain English questions into tool calls and formats results naturally."
            flow="Question → Planner (8B) generates plan → Executor (parallel tools) → Formatter (70B) writes answer"
            example="'Why did truck 84 spend so much?' → calls get_expenses + find_documents → answers with citation"
            stats="Planner: 100ms deterministic. Executor: parallel async. Formatter: 500ms natural language"
          />

          {/* Module 5 */}
          <Module
            number={5}
            title="Frontend UI"
            status="✅ Complete"
            description="Chat, dashboards, document viewer, entity graph, and transparency panel for judges/operators."
            flow="User Question → Chat interface → Shows results + sources + tool transparency"
            example="Ask 'find tax forms for truck 84' → System shows 1 document → Click to preview → See extraction confidence"
            stats="Dark theme, 5 views, mocked API ready for real backend, source citations"
          />
        </div>
      </section>

      {/* How It Works - Query Examples */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Search className="text-blue-400" />
          Query Types It Handles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Structured */}
          <div className="bg-slate-900 border border-blue-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-bold text-blue-300 mb-2">STRUCTURED</h3>
            <p className="text-xs text-slate-400 mb-3">SQL queries on fleet expenses, revenue, profit</p>
            <div className="bg-slate-800 rounded p-2 text-xs text-slate-300 font-mono mb-2">
              "How much on parts?"
            </div>
            <p className="text-xs text-slate-500">
              → get_expenses(category=parts) → $2,287.50
            </p>
          </div>

          {/* Retrieval */}
          <div className="bg-slate-900 border border-green-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-bold text-green-300 mb-2">RETRIEVAL</h3>
            <p className="text-xs text-slate-400 mb-3">Vector search for documents by meaning</p>
            <div className="bg-slate-800 rounded p-2 text-xs text-slate-300 font-mono mb-2">
              "Find tax forms for truck 84"
            </div>
            <p className="text-xs text-slate-500">
              → resolve(84) + search(entity=T-084, type=tax) → 1 document
            </p>
          </div>

          {/* Hybrid */}
          <div className="bg-slate-900 border border-purple-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-bold text-purple-300 mb-2">HYBRID</h3>
            <p className="text-xs text-slate-400 mb-3">Both SQL and retrieval in one answer</p>
            <div className="bg-slate-800 rounded p-2 text-xs text-slate-300 font-mono mb-2">
              "Why did truck 84 spend so much?"
            </div>
            <p className="text-xs text-slate-500">
              → get_expenses(truck=84) + find_documents(truck=84) → analysis + sources
            </p>
          </div>
        </div>
      </section>

      {/* Design Principles */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Shield className="text-yellow-400" />
          Design Principles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Principle
            title="Zero Hallucination"
            description="LLM never generates facts. Only generates tool calls. Facts come from validated data."
            icon="🎯"
          />
          <Principle
            title="MCP Security Boundary"
            description="LLM can't access database directly or generate SQL. Only calls typed, validated tools."
            icon="🛡️"
          />
          <Principle
            title="Entity Resolution"
            description="All truck references normalized to canonical IDs with confidence scoring (0.6-1.0)."
            icon="🔗"
          />
          <Principle
            title="Grounded in Documents"
            description="Every answer includes sources. Operators click citations to view original documents."
            icon="📎"
          />
          <Principle
            title="Transparent Execution"
            description="Judges see tool calls, execution time, and anti-hallucination proof in transparency panel."
            icon="👁️"
          />
          <Principle
            title="Scalable Architecture"
            description="Handles 1000s of carriers, millions of documents, 50+ docs/week ingestion."
            icon="📈"
          />
        </div>
      </section>

      {/* Current Status */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Current Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <StatusBadge label="Module 1" status="TODO" />
          <StatusBadge label="Module 2" status="TODO" />
          <StatusBadge label="Module 3" status="DONE" />
          <StatusBadge label="Module 4" status="TODO" />
          <StatusBadge label="Module 5" status="DONE" />
        </div>
        <p className="text-slate-400 text-sm mt-4">
          <strong>230 documents pre-ingested.</strong> Navigate to Chat to ask questions (using mocked responses until backend modules are complete).
        </p>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800/50 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Ready to explore?</h3>
        <p className="text-slate-300 mb-4">
          Click "Chat" to ask about fleet finances, documents, or operational status.
        </p>
        <p className="text-sm text-slate-500">
          Try: "How much on parts?" • "Find tax form for truck 84" • "Which trucks profitable?"
        </p>
      </div>
    </div>
  );
}

function Module({
  number,
  title,
  status,
  description,
  flow,
  example,
  stats,
}: {
  number: number;
  title: string;
  status: string;
  description: string;
  flow: string;
  example: string;
  stats: string;
}) {
  const bgColor = status.includes('Complete') ? 'bg-green-900/10 border-green-800/50' : 'bg-blue-900/10 border-blue-800/50';
  const statusColor = status.includes('Complete') ? 'text-green-400' : 'text-blue-400';

  return (
    <div className={`bg-slate-900 border rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-purple-400">Module {number}</span>
            <span className={`text-sm font-semibold ${statusColor}`}>{status}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-3">{description}</p>

      <div className="space-y-2 text-xs text-slate-400 bg-slate-800/50 rounded p-2 mb-3">
        <p>
          <span className="text-slate-500 font-semibold">Flow:</span> {flow}
        </p>
        <p>
          <span className="text-slate-500 font-semibold">Example:</span> {example}
        </p>
        <p>
          <span className="text-slate-500 font-semibold">Stats:</span> {stats}
        </p>
      </div>
    </div>
  );
}

function Principle({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  const bgColor = status === 'DONE' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-blue-900/30 text-blue-400 border-blue-800';
  return (
    <div className={`border rounded p-2 text-center font-semibold ${bgColor}`}>
      {label}
      <div className="text-xs font-normal opacity-75">{status}</div>
    </div>
  );
}
