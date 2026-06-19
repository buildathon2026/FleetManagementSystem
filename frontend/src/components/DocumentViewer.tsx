import { useEffect, useState } from 'react';
import { FileText, Search, Filter, Link2, AlertTriangle } from 'lucide-react';
import apiService from '../services/mockApi';

interface Document {
  id: string;
  type: string;
  truck_id: string;
  date: string;
  summary: string;
}

const DOC_TYPE_ICONS: Record<string, string> = {
  fuel_receipt: '⛽',
  maintenance_invoice: '🔧',
  tax_form: '📋',
  insurance_cert: '🛡️',
  registration: '📜',
  inspection: '🔍',
  settlement: '✅',
  email: '📧',
  toll_receipt: '🛣️',
  title: '🎫',
};

export default function DocumentViewer({ truckId }: { truckId: string | null }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const result = await apiService.searchDocuments(searchQuery, truckId || undefined);
        setDocuments(result.documents);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [truckId, searchQuery]);

  const filteredDocs = documents.filter(
    (doc) => docTypeFilter === 'all' || doc.type === docTypeFilter
  );

  const docTypes = [...new Set(documents.map((d) => d.type))];

  return (
    <div className="space-y-6">
      {/* Context Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          <span className="font-semibold">Before:</span> Finding truck documents meant calling dispatch or checking filing cabinets.<br />
          <span className="font-semibold">Now:</span> Search across {documents.length || 'all'} documents {truckId && `for ${truckId}`}.
          Entity resolution linked different truck references automatically.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by document content or truck reference..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-slate-400" />
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            {docTypes.map((type) => (
              <option key={type} value={type}>
                {DOC_TYPE_ICONS[type] || '📄'} {type.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>

          {truckId && (
            <span className="text-sm text-slate-300 ml-auto px-3 py-2 bg-slate-800 rounded border border-slate-700">
              <Link2 size={14} className="inline mr-2" />
              Linked to: <span className="font-bold text-purple-400">{truckId}</span>
            </span>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
            📄 Documents ({filteredDocs.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-slate-400 text-sm p-4 text-center">Searching...</p>
            ) : filteredDocs.length === 0 ? (
              <div className="text-slate-400 text-sm p-4 text-center bg-slate-800 rounded border border-slate-700">
                <AlertTriangle size={20} className="mx-auto mb-2 opacity-50" />
                No documents found
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    selectedDoc?.id === doc.id
                      ? 'bg-purple-900/30 border-purple-600 ring-2 ring-purple-600/30'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">
                      {DOC_TYPE_ICONS[doc.type] || '📄'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-purple-400 truncate">{doc.id}</p>
                      <p className="text-xs text-slate-400 truncate">{doc.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500 mt-1">{doc.date}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                        <Link2 size={12} />
                        {doc.truck_id}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Viewer */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
              {/* Document Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{DOC_TYPE_ICONS[selectedDoc.type] || '📄'}</span>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">DOCUMENT ID</p>
                    <p className="text-xl font-bold text-purple-400">{selectedDoc.id}</p>
                  </div>
                </div>
              </div>

              {/* Entity Linking */}
              <div className="bg-green-900/20 border border-green-700/50 rounded p-3">
                <p className="text-xs text-green-400 font-semibold flex items-center gap-2 mb-2">
                  <Link2 size={14} />
                  ENTITY RESOLUTION
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Canonical Truck ID:</span>
                    <span className="font-bold text-green-300">{selectedDoc.truck_id}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-400">
                    <span>Linking confidence</span>
                    <span>95% (Unit normalization)</span>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 rounded p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">TYPE</p>
                  <p className="font-semibold text-slate-100">
                    {selectedDoc.type.replace(/_/g, ' ').toUpperCase()}
                  </p>
                </div>
                <div className="bg-slate-800 rounded p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">DATE</p>
                  <p className="font-semibold text-slate-100">{selectedDoc.date}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-800 rounded p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2 font-semibold">SUMMARY</p>
                <p className="text-sm text-slate-100 leading-relaxed">{selectedDoc.summary}</p>
              </div>

              {/* Extraction Data */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-400 font-semibold mb-3">EXTRACTION METRICS</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-slate-800 rounded border border-slate-700">
                    <span className="text-slate-400">Field Extraction</span>
                    <span className="text-green-400 font-semibold">✅ Complete</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800 rounded border border-slate-700">
                    <span className="text-slate-400">Confidence Score</span>
                    <span className="text-green-400 font-semibold">95%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800 rounded border border-slate-700">
                    <span className="text-slate-400">Vector Embedding</span>
                    <span className="text-blue-400 font-semibold">Ready for Search</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-slate-400">Select a document to view details and extraction</p>
              <p className="text-xs text-slate-500 mt-2">All documents are entity-linked to their trucks</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <p className="text-xs text-slate-400">
          💡 <strong>How Entity Resolution Works:</strong> Documents reference trucks as "Unit 84", "Trk 84", "T-084", or just "84".
          Our system normalizes all these to canonical ID "T-084" with confidence scores, enabling perfect document linking.
        </p>
      </div>
    </div>
  );
}
