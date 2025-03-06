'use client';

import { useEffect, useState } from 'react';
import { ChecklistResponse, ChecklistItem } from '@/types/checklist';
import { getChecklists } from '@/services/api';
import { ChecklistTable } from '@/components/ChecklistTable';
import { Header } from '@/components/Header';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const response = await getChecklists();
      setChecklists(response.Dados);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar os dados. Por favor, tente novamente.');
      console.error('Erro ao carregar checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChecklists = checklists.filter(item => 
    item.NUMEROREFERENCIA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.TRANSPORTADORA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.STATUS.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por referência, transportadora ou status..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-4">{error}</div>
            ) : (
              <ChecklistTable items={filteredChecklists} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
