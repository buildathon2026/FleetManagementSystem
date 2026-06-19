# Fleet Intelligence Frontend (Module 5)

React + TypeScript frontend for the Fleet Management System with mocked API responses. Provides real-time Q&A, fleet dashboards, entity graphs, and document viewer.

## Features

- **Chat Interface**: Natural language Q&A with source citations and confidence scoring
- **Fleet Dashboard**: Real-time metrics (revenue, trucks, alerts) with truck cards
- **Entity Graph**: Interactive visualization of truck entities and relationships
- **Document Viewer**: Search and preview ingested documents with metadata
- **Transparency Panel**: Shows tool calls, execution time, and anti-hallucination proof
- **Dark Theme**: Professional dark UI with Tailwind CSS

## Quick Start

```bash
# Install dependencies
make install

# Start development server (http://localhost:3000)
make dev

# Build for production
make build
```

## Architecture

```
src/
├── components/
│   ├── Chat.tsx              # Q&A interface with sources
│   ├── Dashboard.tsx         # Fleet overview & alerts
│   ├── EntityGraph.tsx       # Truck relationships
│   ├── DocumentViewer.tsx    # Search & preview documents
│   └── TransparencyPanel.tsx # Tool execution logs
├── services/
│   └── mockApi.ts            # Mock API (swappable for real backend)
├── App.tsx                   # Router & main layout
├── main.tsx                  # Entry point
└── index.css                 # Tailwind + global styles
```

## Configuration

Backend API URL is configured in `.env`:

```env
VITE_API_URL=http://192.168.1.160:8002
```

Change this to your MCP Data Server endpoint.

## API Integration

### Mock API (Current)

The frontend uses `src/services/mockApi.ts` which:
- Falls back to mock data if backend is unreachable
- Simulates MCP Data Server responses
- Easy to swap for real backend

### Real Backend

Once the backend is ready, the API service will automatically use:

```typescript
GET  /tools/fleet-overview      → Fleet stats, trucks, alerts
GET  /tools/expenses            → Spending by category/truck
GET  /tools/revenue             → Revenue data
GET  /tools/documents           → Semantic search
GET  /tools/entity/resolve      → Map mentions to IDs
POST /ask                       → LLM Q&A with tool calls
```

## Component Details

### Chat.tsx
- Message history with user/assistant roles
- Source citations as clickable tags
- Confidence indicators (HIGH/MEDIUM/LOW)
- 👍/👎 feedback buttons for RLHF
- Tool execution transparency

### Dashboard.tsx
- Summary stats: total revenue, active trucks, average
- Alert cards with severity levels (critical, alert, warning)
- Truck grid with: ID, driver, status, revenue, doc count
- Clickable trucks to select for other views

### EntityGraph.tsx
- Entity list with filtering
- Entity details panel
- Aliases and relationships
- Connection stats

### DocumentViewer.tsx
- Search across all documents
- Filter by document type
- Document preview with metadata
- Extracted data confidence

### TransparencyPanel.tsx
- Query type badge [STRUCTURED] [RETRIEVAL] [HYBRID]
- Tool calls with params and execution time
- Total Q&A latency
- Anti-hallucination proof message

## Styling

- **Framework**: Tailwind CSS v3.3+
- **Theme**: Dark (slate-950 background)
- **Colors**: Purple/blue accents, green for success, red for alerts
- **Icons**: Lucide React (18-24px)

## Development

```bash
# Start dev server with HMR
npm run dev

# Type checking
npm run build

# Linting
npm run lint
```

## Production Build

```bash
make build
# Output in dist/
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, S3, etc.).

## Mocked Endpoints

Currently returning mock data:

| Endpoint | Mock Data |
|----------|-----------|
| `/ask` | Q&A with 3 sample tool calls |
| `/tools/fleet-overview` | 10 trucks with revenue/alerts |
| `/tools/expenses` | Sample maintenance invoices |
| `/tools/revenue` | Monthly revenue per truck |
| `/tools/documents` | 5 sample documents |
| `/tools/entity/resolve` | Parse truck mentions locally |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- **React**: 19.2.6
- **React Router**: 6.20.0
- **Axios**: 1.6.0 (HTTP client)
- **Tailwind CSS**: 3.3.6 (styling)
- **Lucide React**: 0.292.0 (icons)
- **Vite**: 8.0.12 (build tool)

## Next Steps

1. **Connect real backend**: Update `VITE_API_URL` and remove mock fallbacks
2. **Add multi-turn conversations**: Store message history server-side
3. **Entity graph visualization**: Upgrade to vis.js or d3-force
4. **Document preview**: Render full document text with highlighting
5. **User auth**: Add login/tenant isolation

---

**Status**: Module 5 - Frontend ✅ Complete (mocked backend)  
**Build Time**: ~2 hours  
**API Integration**: Ready for real backend
