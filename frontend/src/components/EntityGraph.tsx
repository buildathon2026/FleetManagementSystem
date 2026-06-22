import { useState, useEffect } from 'react';
import { Network, MapPin, Users } from 'lucide-react';
import apiService from '../services/mockApi';

interface Entity {
  id: string;
  type: string;
  name: string;
  aliases: string[];
  docCount: number;
}

export default function EntityGraph({ onSelectEntity }: { onSelectEntity: (id: string) => void }) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overview = await apiService.getFleetOverview();
        const mappedEntities = overview.trucks.map((truck: any) => ({
          id: truck.id,
          type: 'truck',
          name: `${truck.id} - ${truck.driver}`,
          aliases: [truck.id],
          docCount: truck.doc_count,
        }));
        setEntities(mappedEntities);
      } catch (error) {
        console.error('Error fetching entities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading relationships...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#fbfffd] border border-teal-100 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4 text-slate-950">
          <Network size={24} />
          Fleet Relationships
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entity List */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-slate-700 mb-3">Trucks ({entities.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    setSelectedEntity(entity.id);
                    onSelectEntity(entity.id);
                  }}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    selectedEntity === entity.id
                      ? 'bg-teal-800 border-teal-700 text-white'
                      : 'bg-white/80 border-teal-100 hover:border-teal-200 hover:bg-teal-50/70'
                  }`}
                >
                  <p className={selectedEntity === entity.id ? 'font-semibold text-white' : 'font-semibold text-teal-800'}>
                    {entity.id}
                  </p>
                  <p className={selectedEntity === entity.id ? 'text-xs text-teal-100' : 'text-xs text-slate-500'}>
                    {entity.type}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Entity Details */}
          <div className="lg:col-span-2">
            {selectedEntity ? (
              <div className="bg-sky-50/70 border border-sky-100 rounded-lg p-4 space-y-4">
                {(() => {
                  const entity = entities.find((e) => e.id === selectedEntity);
                  return entity ? (
                    <>
                      <div>
                        <h4 className="text-lg font-semibold text-teal-800 mb-2">{entity.id}</h4>
                        <p className="text-sm text-slate-600">{entity.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/80 rounded p-3 border border-sky-100">
                          <p className="text-xs text-slate-500 mb-1">Type</p>
                          <p className="font-semibold text-slate-950">{entity.type}</p>
                        </div>
                        <div className="bg-white/80 rounded p-3 border border-sky-100">
                          <p className="text-xs text-slate-500 mb-1">Documents</p>
                          <p className="font-semibold text-slate-950">{entity.docCount}</p>
                        </div>
                      </div>

                      {entity.aliases.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">Aliases</p>
                          <div className="flex flex-wrap gap-2">
                            {entity.aliases.map((alias) => (
                              <span key={alias} className="text-xs bg-white/80 px-2 py-1 rounded text-slate-700 border border-sky-100">
                                {alias}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Entities */}
                      <div className="bg-white/80 rounded p-3 border border-sky-100">
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Users size={16} />
                          Connected Entities
                        </p>
                        <div className="text-xs text-slate-600">
                          <p>→ Driver relationship active</p>
                          <p>→ Documents: {entity.docCount}</p>
                          <p>→ Cross-references: {Math.floor(Math.random() * 10) + 1}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500">Entity not found</p>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-sky-50/70 border border-sky-100 rounded-lg p-8 text-center">
                <MapPin size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-slate-600">Select a truck to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox label="Total Entities" value={entities.length.toString()} />
        <StatBox label="Truck Type" value={entities.filter((e) => e.type === 'truck').length.toString()} />
        <StatBox label="Total Connections" value={entities.reduce((sum, e) => sum + e.docCount, 0).toString()} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#fbfffd] border border-teal-100 rounded-lg p-4 text-center shadow-sm">
      <p className="text-sm text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-semibold text-teal-800">{value}</p>
    </div>
  );
}
