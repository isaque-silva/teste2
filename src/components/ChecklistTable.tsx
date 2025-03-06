import { ChecklistItem } from '@/types/checklist';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface ChecklistTableProps {
  items: ChecklistItem[];
}

export function ChecklistTable({ items }: ChecklistTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleRowDoubleClick = (handle: string) => {
    router.push(`/checklist/${handle}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Referência</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transportadora</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr 
              key={item.Handle} 
              className="hover:bg-gray-50 cursor-pointer" 
              onDoubleClick={() => handleRowDoubleClick(item.Handle)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Codigo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.NUMEROREFERENCIA}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.DATA)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.TRANSPORTADORA}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.STATUS === 'Em execucao' ? 'bg-green-100 text-green-800' :
                  item.STATUS === 'Ag execucao' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.STATUS}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.USUARIO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 