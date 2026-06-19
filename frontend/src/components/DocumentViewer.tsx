import { useEffect, useState } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import apiService from '../services/mockApi';

interface Document {
  id: string;
  type: string;
  truck_id: string;
  date: string;
  summary: string;
}

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
      {/* Search and Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
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
                {type.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>

          {truckId && (
            <span className="text-sm text-purple-400 ml-auto">
              Filtering by: <strong>{truckId}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-slate-300 mb-3">
            Documents ({filteredDocs.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-slate-400 text-sm p-4 text-center">Loading...</p>
            ) : filteredDocs.length === 0 ? (
              <p className="text-slate-400 text-sm p-4 text-center">No documents found</p>
            ) : (
              filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    selectedDoc?.id === doc.id
                      ? 'bg-purple-900/30 border-purple-600'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText size={16} className="mt-1 flex-shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-purple-400 truncate">{doc.id}</p>
                      <p className="text-xs text-slate-400 truncate">{doc.type}</p>
                      <p className="text-xs text-slate-500">{doc.date}</p>
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
              <div>
                <p className="text-xs text-slate-400 mb-1">DOCUMENT ID</p>
                <p className="text-xl font-bold text-purple-400">{selectedDoc.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">TYPE</p>
                  <p className="font-semibold text-slate-100">{selectedDoc.type.replace(/_/g, ' ').toUpperCase()}</p>
                </div>
                <div className="bg-slate-800 rounded p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">DATE</p>
                  <p className="font-semibold text-slate-100">{selectedDoc.date}</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">TRUCK ID</p>
                <p className="font-semibold text-green-400">{selectedDoc.truck_id}</p>
              </div>

              <div className="bg-slate-800 rounded p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">SUMMARY</p>
                <p className="text-sm text-slate-100 leading-relaxed">{selectedDoc.summary}</p>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-400 mb-2">EXTRACTED DATA</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="text-green-400 font-semibold">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Entities Resolved:</span>
                    <span className="text-slate-100 font-semibold">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vector Embedding:</span>
                    <span className="text-slate-100 font-semibold">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-slate-400">Select a document to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
