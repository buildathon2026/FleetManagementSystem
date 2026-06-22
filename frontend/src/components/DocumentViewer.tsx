import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Link2, Search, UploadCloud } from 'lucide-react';
import apiService from '../services/mockApi';

interface FleetDocument {
  id: string;
  type: string;
  truck_id: string;
  date: string;
  summary: string;
}

const documentLabels: Record<string, string> = {
  fuel_receipt: 'Fuel receipt',
  maintenance_invoice: 'Maintenance',
  tax_form: 'Tax form',
  insurance_cert: 'Insurance',
  registration: 'Registration',
  inspection: 'Inspection',
  settlement: 'Settlement',
  email: 'Email',
  toll_receipt: 'Toll receipt',
  title: 'Title',
};

export default function DocumentViewer({ truckId }: { truckId: string | null }) {
  const [documents, setDocuments] = useState<FleetDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState(truckId || '');
  const [selectedDoc, setSelectedDoc] = useState<FleetDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  useEffect(() => {
    if (truckId) {
      setSearchQuery(truckId);
    }
  }, [truckId]);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const result = await apiService.searchDocuments(searchQuery, truckId || undefined);
        const nextDocuments = result.documents || [];
        setDocuments(nextDocuments);
        setSelectedDoc((current) => current || nextDocuments[0] || null);
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
  const docTypes = [...new Set(documents.map((doc) => doc.type))];

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setUploadStatus({ type: 'idle', message: '' });

    try {
      const result = await apiService.uploadDocuments(uploadFiles);
      setUploadStatus({
        type: 'success',
        message: `${result.total_files || uploadFiles.length} file(s) sent to ingestion.`,
      });
      setUploadFiles([]);
      setSearchQuery('');
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message:
          'Upload area is ready, but the ingestion backend is not reachable locally yet. Start the backend on port 8004 to process files.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Documents</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search records by truck, date, document type, or a phrase from the document.
          </p>
        </div>
        {truckId && (
          <div className="inline-flex items-center gap-2 rounded-md border border-teal-100 bg-[#fbfffd] px-3 py-2 text-sm font-medium text-slate-700">
            <Link2 size={16} />
            Selected truck: {truckId}
          </div>
        )}
      </div>

      <section className="rounded-lg border border-dashed border-sky-200 bg-sky-50/70 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="flex cursor-pointer flex-col gap-3 rounded-lg border border-sky-100 bg-white/80 p-5 hover:border-sky-200">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-800">
                <UploadCloud size={23} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">Upload fleet documents</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Upload a PDF, PNG, JPEG, or text document such as titles, registrations, insurance, tax forms, fuel receipts, or maintenance records.
                </p>
              </div>
            </div>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.txt,.json,.csv,.md,application/pdf,image/png,image/jpeg"
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                setUploadFiles(files);
                setUploadStatus({ type: 'idle', message: '' });
              }}
            />
          </label>

          <div className="space-y-3 lg:min-w-64">
            <button
              onClick={handleUpload}
              disabled={uploading || uploadFiles.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <UploadCloud size={18} />
              {uploading ? 'Uploading...' : 'Upload to ingestion'}
            </button>
            {uploadFiles.length > 0 && (
              <div className="rounded-md border border-sky-100 bg-white/80 p-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">{uploadFiles.length} selected</p>
                <p className="mt-1 truncate text-xs">{uploadFiles.map((file) => file.name).join(', ')}</p>
              </div>
            )}
            {uploadStatus.type !== 'idle' && (
              <div
                className={
                  uploadStatus.type === 'success'
                    ? 'flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800'
                    : 'flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'
                }
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
                ) : (
                  <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-teal-100 bg-[#fbfffd] p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <span className="sr-only">Search documents</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search documents, for example T-084 or insurance"
              className="w-full rounded-md border border-teal-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <select
            value={docTypeFilter}
            onChange={(event) => setDocTypeFilter(event.target.value)}
            className="rounded-md border border-teal-200 bg-white px-3 py-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">All document types</option>
            {docTypes.map((type) => (
              <option key={type} value={type}>
                {formatType(type)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-teal-100 bg-[#fbfffd] shadow-sm">
          <div className="border-b border-teal-100 p-4">
            <h2 className="font-semibold text-slate-950">Results</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? 'Searching...' : `${filteredDocs.length} documents found`}
            </p>
          </div>

          <div className="max-h-[560px] overflow-y-auto p-2">
            {filteredDocs.length === 0 ? (
              <div className="m-2 rounded-lg border border-sky-100 bg-sky-50/70 p-6 text-center text-sm text-slate-600">
                <AlertTriangle className="mx-auto mb-2 text-slate-400" size={24} />
                No documents match this search.
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={
                    selectedDoc?.id === doc.id
                      ? 'w-full rounded-md border border-teal-700 bg-teal-800 p-3 text-left text-white'
                      : 'w-full rounded-md border border-transparent p-3 text-left hover:border-teal-100 hover:bg-teal-50/70'
                  }
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={
                        selectedDoc?.id === doc.id
                          ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10'
                          : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700'
                      }
                    >
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{doc.id}</p>
                      <p className={selectedDoc?.id === doc.id ? 'text-xs text-slate-300' : 'text-xs text-slate-500'}>
                        {formatType(doc.type)} · {doc.truck_id}
                      </p>
                      <p className={selectedDoc?.id === doc.id ? 'mt-1 text-xs text-slate-300' : 'mt-1 text-xs text-slate-500'}>
                        {doc.date}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-teal-100 bg-[#fbfffd] shadow-sm">
          {selectedDoc ? (
            <div>
              <div className="border-b border-teal-100 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{formatType(selectedDoc.type)}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">{selectedDoc.id}</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <Link2 size={16} />
                    Linked to {selectedDoc.truck_id}
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem label="Truck" value={selectedDoc.truck_id} />
                  <InfoItem label="Date" value={selectedDoc.date} />
                  <InfoItem label="Type" value={formatType(selectedDoc.type)} />
                  <InfoItem label="Status" value="Ready to review" />
                </div>

                <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">Summary</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedDoc.summary}</p>
                </div>

                <div className="rounded-lg border border-teal-100 bg-white/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">Why this document appears here</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The record is associated with {selectedDoc.truck_id}. Searches can match the truck ID,
                    document type, date, or summary text.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
              <div>
                <FileText className="mx-auto text-slate-300" size={48} />
                <p className="mt-3 font-medium text-slate-700">Select a document</p>
                <p className="mt-1 text-sm text-slate-500">Details will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-teal-100 bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-950">{value}</p>
    </div>
  );
}

function formatType(type: string) {
  return documentLabels[type] || type.replace(/_/g, ' ');
}
