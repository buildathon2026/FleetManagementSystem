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
    return <div className="text-center py-12">Loading entity graph...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-slate-100">
          <Network size={24} />
          Fleet Entity Relationships
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entity List */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-slate-300 mb-3">Entities ({entities.length})</h3>
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
                      ? 'bg-purple-900/30 border-purple-600'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <p className="font-semibold text-purple-400">{entity.id}</p>
                  <p className="text-xs text-slate-400">{entity.type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Entity Details */}
          <div className="lg:col-span-2">
            {selectedEntity ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
                {(() => {
                  const entity = entities.find((e) => e.id === selectedEntity);
                  return entity ? (
                    <>
                      <div>
                        <h4 className="text-lg font-semibold text-purple-400 mb-2">{entity.id}</h4>
                        <p className="text-sm text-slate-300">{entity.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Type</p>
                          <p className="font-semibold text-slate-100">{entity.type}</p>
                        </div>
                        <div className="bg-slate-900 rounded p-3">
                          <p className="text-xs text-slate-400 mb-1">Documents</p>
                          <p className="font-semibold text-slate-100">{entity.docCount}</p>
                        </div>
                      </div>

                      {entity.aliases.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-300 mb-2">Aliases</p>
                          <div className="flex flex-wrap gap-2">
                            {entity.aliases.map((alias) => (
                              <span key={alias} className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700">
                                {alias}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Entities */}
                      <div className="bg-slate-900 rounded p-3 border border-slate-700">
                        <p className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <Users size={16} />
                          Connected Entities
                        </p>
                        <div className="text-xs text-slate-400">
                          <p>→ Driver relationship active</p>
                          <p>→ Documents: {entity.docCount}</p>
                          <p>→ Cross-references: {Math.floor(Math.random() * 10) + 1}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400">Entity not found</p>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <MapPin size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-slate-400">Select an entity to view details</p>
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
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <p className="text-3xl font-bold text-purple-400">{value}</p>
    </div>
  );
}
