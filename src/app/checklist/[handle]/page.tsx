'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChecklistItemDetail } from '@/types/checklist';
import { getChecklistItems, executarChecklist } from '@/services/api';
import { Header } from '@/components/Header';
import { ArrowLeftIcon, CameraIcon, ListBulletIcon, TableCellsIcon, CalendarIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Swal from 'sweetalert2';

export default function ChecklistDetails() {
  const params = useParams();
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [selectedItemHandle, setSelectedItemHandle] = useState<string | null>(null);
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [attachments, setAttachments] = useState<Record<string, File[]>>({});

  useEffect(() => {
    if (params.handle) {
      loadChecklistItems(params.handle as string);
    }
  }, [params.handle]);

  const loadChecklistItems = async (handle: string) => {
    try {
      setLoading(true);
      const response = await getChecklistItems(handle);
      setItems(response.Dados);

      // Inicializa os valores dos campos com o conteúdo do JSON
      const initialValues: Record<string, string> = {};
      response.Dados.forEach(item => {
        // Inicializa a observação com o valor da API
        initialValues[`obs_${item.HANDLE}`] = item.OBSERVACAO || '';

        // Se for campo numérico (TIPOCAMPO = 1), formata para o padrão brasileiro
        if (item.TIPOCAMPO === '1' && item.CONTEUDO) {
          try {
            // Remove espaços e caracteres inválidos
            let value = item.CONTEUDO.trim();
            
            // Converte do formato americano para número
            // Primeiro remove as vírgulas dos milhares (1,234.56 -> 1234.56)
            value = value.replace(/,/g, '');
            const number = parseFloat(value);
            
            if (!isNaN(number)) {
              // Converte para o formato brasileiro
              initialValues[item.HANDLE] = number.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: 'decimal'
              });
            } else {
              initialValues[item.HANDLE] = '';
            }
          } catch {
            initialValues[item.HANDLE] = '';
          }
        } else if (item.TIPOCAMPO === '6' && item.CONTEUDO) {
          // Converte SIM para S e NAO para N
          initialValues[item.HANDLE] = item.CONTEUDO === 'SIM' ? 'S' : item.CONTEUDO === 'NAO' ? 'N' : '';
        } else if (item.TIPOCAMPO === '3' && item.CONTEUDO) {
          // Trata campos de data
          if (item.FORMATODATA === 'Mes e ano Hora e minuto') {
            try {
              const [date, time] = item.CONTEUDO.split(' ');
              if (date.split('/').length === 3) {
                // Se estiver no formato DD/MM/YYYY, converte para MM/YYYY
                const [_, month, year] = date.split('/');
                initialValues[item.HANDLE] = `${month}/${year} ${time}`;
              } else {
                initialValues[item.HANDLE] = item.CONTEUDO;
              }
            } catch {
              initialValues[item.HANDLE] = item.CONTEUDO;
            }
          } else {
            initialValues[item.HANDLE] = item.CONTEUDO;
          }
        } else if (item.TIPOCAMPO === '4') {
          // Para campos de lista, verifica se há algum item marcado como "S"
          const itemMarcado = item.Lista.find(listItem => listItem.MARCADO === 'S');
          if (itemMarcado) {
            initialValues[item.HANDLE] = itemMarcado.HANDLE;
            initialValues[`nome_${item.HANDLE}`] = itemMarcado.NOME;
          } else {
            initialValues[item.HANDLE] = item.CONTEUDO || '';
            // Se tiver CONTEUDO, procura o handle correspondente
            if (item.CONTEUDO) {
              const itemLista = item.Lista.find(listItem => listItem.NOME === item.CONTEUDO);
              if (itemLista) {
                initialValues[item.HANDLE] = itemLista.HANDLE;
                initialValues[`nome_${item.HANDLE}`] = itemLista.NOME;
              }
            }
          }
        } else {
          initialValues[item.HANDLE] = item.CONTEUDO || '';
        }
      });
      setItemValues(initialValues);

      setError(null);
    } catch (err) {
      setError('Erro ao carregar os itens do checklist. Por favor, tente novamente.');
      console.error('Erro ao carregar itens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (handle: string, value: string) => {
    setItemValues(prev => ({ ...prev, [handle]: value }));
  };

  const getTipoCampoIcon = (tipoCampo: string) => {
    switch (tipoCampo) {
      case '1':
        return <span title="Campo Numérico" className="text-gray-600">#</span>;
      case '2':
        return <span title="Campo Texto" className="text-gray-600">Aa</span>;
      case '3':
        return <CalendarIcon className="h-5 w-5 text-gray-600" title="Campo Data" />;
      case '4':
        return <ListBulletIcon className="h-5 w-5 text-gray-600" title="Campo Lista" />;
      case '5':
        return <TableCellsIcon className="h-5 w-5 text-gray-600" title="Campo Tabela" />;
      case '6':
        return <span title="Campo Lógico" className="text-gray-600">S/N</span>;
      case '7':
        return <CameraIcon className="h-5 w-5 text-blue-500" title="Campo de Foto" />;
      default:
        return null;
    }
  };

  const formatNumberToBrazilian = (value: string) => {
    if (!value) return '';
    
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Converte para número considerando os últimos 2 dígitos como decimais
    const intPart = numbers.slice(0, -2) || '0';
    const decPart = numbers.slice(-2).padStart(2, '0');
    const number = parseFloat(`${intPart}.${decPart}`);

    // Formata o número para o padrão brasileiro
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseNumberFromBrazilian = (value: string) => {
    if (!value) return '';
    // Remove todos os caracteres não numéricos, exceto ponto e vírgula
    const numbers = value.replace(/[^\d,.]/g, '');
    // Converte para número
    const number = parseFloat(numbers.replace(/\./g, '').replace(',', '.'));
    if (isNaN(number)) return '';
    return number.toString();
  };

  const renderInputField = (item: ChecklistItemDetail) => {
    const value = itemValues[item.HANDLE] || '';

    switch (item.TIPOCAMPO) {
      case '1': // Numérico
        return (
          <input
            type="text"
            inputMode="numeric"
            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            value={value}
            onChange={(e) => {
              // Remove tudo que não for número
              let numericValue = e.target.value.replace(/\D/g, '');
              
              // Se tiver mais de 2 dígitos, formata como moeda
              if (numericValue.length > 2) {
                const intPart = numericValue.slice(0, -2).replace(/^0+/, '');
                const decPart = numericValue.slice(-2);
                numericValue = `${intPart || '0'}.${decPart}`;
                const number = parseFloat(numericValue);
                handleValueChange(item.HANDLE, number.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }));
              } else {
                // Se tiver 2 dígitos ou menos, apenas mantém os números
                handleValueChange(item.HANDLE, numericValue);
              }
            }}
            onBlur={(e) => {
              // Ao perder o foco, garante a formatação completa
              if (e.target.value) {
                const numericValue = e.target.value.replace(/\D/g, '').padStart(3, '0');
                const intPart = numericValue.slice(0, -2).replace(/^0+/, '');
                const decPart = numericValue.slice(-2);
                const number = parseFloat(`${intPart || '0'}.${decPart}`);
                handleValueChange(item.HANDLE, number.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }));
              }
            }}
          />
        );
      case '2': // Texto
        return (
          <input
            type="text"
            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => handleValueChange(item.HANDLE, e.target.value)}
          />
        );
      case '3': // Data
        const getInputType = (formatoData: string) => {
          switch (formatoData) {
            case 'Dia, mes e ano Hora, minuto e segundo':
              return 'datetime-local';
            case 'Mes e ano Hora e minuto':
              return 'month';
            case 'Dia, mes e ano':
              return 'date';
            case 'Hora e minuto':
              return 'time';
            default:
              return 'datetime-local';
          }
        };

        const formatValue = (value: string, formatoData: string) => {
          if (!value) return '';
          
          try {
            const parts = value.split(' ');
            switch (formatoData) {
              case 'Dia, mes e ano Hora, minuto e segundo': {
                const [date, time] = parts;
                const [day, month, year] = date.split('/');
                return `${year}-${month}-${day}T${time}`;
              }
              case 'Mes e ano Hora e minuto': {
                const [date, time] = parts;
                const dateParts = date.split('/');
                const month = dateParts.length === 3 ? dateParts[1] : dateParts[0];
                const year = dateParts.length === 3 ? dateParts[2] : dateParts[1];
                return `${year}-${month}`;
              }
              case 'Dia, mes e ano': {
                const [day, month, year] = value.split('/');
                return `${year}-${month}-${day}`;
              }
              case 'Hora e minuto':
                return value;
              default:
                return value;
            }
          } catch {
            return value;
          }
        };

        const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          let formattedValue = '';

          try {
            switch (item.FORMATODATA) {
              case 'Dia, mes e ano Hora, minuto e segundo': {
                const [date, time] = newValue.split('T');
                const [year, month, day] = date.split('-');
                formattedValue = `${day}/${month}/${year} ${time}`;
                break;
              }
              case 'Mes e ano Hora e minuto': {
                if (e.target.type === 'month') {
                  const [year, month] = newValue.split('-');
                  const currentValue = itemValues[item.HANDLE] || '';
                  const currentTime = currentValue.split(' ')[1] || '00:00';
                  formattedValue = `${month}/${year} ${currentTime}`;
                } else if (e.target.type === 'time') {
                  const currentValue = itemValues[item.HANDLE] || '';
                  const [currentDate] = currentValue.split(' ');
                  formattedValue = `${currentDate || '01/2024'} ${newValue}`;
                }
                break;
              }
              case 'Dia, mes e ano': {
                const [year, month, day] = newValue.split('-');
                formattedValue = `${day}/${month}/${year}`;
                break;
              }
              case 'Hora e minuto':
                formattedValue = newValue;
                break;
              default:
                formattedValue = newValue;
            }
          } catch {
            formattedValue = newValue;
          }

          handleValueChange(item.HANDLE, formattedValue);
        };

        if (item.FORMATODATA === 'Mes e ano Hora e minuto') {
          const [dateValue, timeValue] = (value || '').split(' ');
          return (
            <div className="flex space-x-2">
              <input
                type="month"
                className="w-2/3 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formatValue(dateValue || '', item.FORMATODATA)}
                onChange={handleDateChange}
              />
              <input
                type="time"
                className="w-1/3 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={timeValue || ''}
                onChange={handleDateChange}
              />
            </div>
          );
        }

        return (
          <input
            type={getInputType(item.FORMATODATA)}
            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formatValue(value, item.FORMATODATA)}
            onChange={handleDateChange}
          />
        );
      case '4': // Lista
        return (
          <select
            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => {
              const selectedOption = item.Lista.find(listItem => listItem.HANDLE === e.target.value);
              if (selectedOption) {
                handleValueChange(item.HANDLE, selectedOption.HANDLE);
                handleValueChange(`nome_${item.HANDLE}`, selectedOption.NOME);
              } else {
                handleValueChange(item.HANDLE, '');
                handleValueChange(`nome_${item.HANDLE}`, '');
              }
            }}
          >
            <option value="">Selecione...</option>
            {item.Lista.map((listItem, index) => (
              <option 
                key={`${item.HANDLE}-${index}`} 
                value={listItem.HANDLE}
              >
                {listItem.NOME}
              </option>
            ))}
          </select>
        );
      case '5': // Tabela
        return (
          <button
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
            onClick={() => alert('Abrir tabela')}
          >
            Abrir Tabela
          </button>
        );
      case '6': // Lógico
        return (
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                checked={value === 'S'}
                onChange={() => handleValueChange(item.HANDLE, 'S')}
                name={`logical-${item.HANDLE}`}
              />
              <span className="ml-2 text-sm text-gray-700">Sim</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                checked={value === 'N'}
                onChange={() => handleValueChange(item.HANDLE, 'N')}
                name={`logical-${item.HANDLE}`}
              />
              <span className="ml-2 text-sm text-gray-700">Não</span>
            </label>
          </div>
        );
      case '7': // Foto
        return null;
      default:
        return null;
    }
  };

  const sortedItems = items.sort((a, b) => Number(a.ORDEM) - Number(b.ORDEM));

  const onDrop = (acceptedFiles: File[]) => {
    if (selectedItemHandle) {
      setAttachments(prev => ({
        ...prev,
        [selectedItemHandle]: [...(prev[selectedItemHandle] || []), ...acceptedFiles]
      }));

      const item = items.find(i => i.HANDLE === selectedItemHandle);
      if (item && item.TIPOCAMPO === '7') {
        const existingFiles = attachments[selectedItemHandle] || [];
        const allFiles = [...existingFiles, ...acceptedFiles];
        const fileNames = allFiles.map(file => file.name).join(', ');
        handleValueChange(selectedItemHandle, fileNames);
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true
  });

  const openDropzone = (handle: string) => {
    setSelectedItemHandle(handle);
    setIsDropzoneOpen(true);
  };

  const removeAttachment = (handle: string, index: number) => {
    setAttachments(prev => {
      const newAttachments = {
        ...prev,
        [handle]: prev[handle].filter((_, i) => i !== index)
      };

      const item = items.find(i => i.HANDLE === handle);
      if (item && item.TIPOCAMPO === '7') {
        const fileNames = newAttachments[handle].map(file => file.name).join(', ');
        handleValueChange(handle, fileNames);
      }

      return newAttachments;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const checklistItemData = sortedItems.map(item => {
        let valorTexto: string | number | boolean | null = itemValues[item.HANDLE] || '';

        // Converte o valor de acordo com o tipo do campo
        switch (item.TIPOCAMPO) {
          case '6': // Lógico
            valorTexto = valorTexto === 'S' ? true : valorTexto === 'N' ? false : null;
            break;
          case '1': // Numérico
            if (valorTexto) {
              // Remove os separadores de milhar e converte vírgula para ponto
              valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
            } else {
              valorTexto = '0.00';
            }
            break;
          case '3': // Data
            if (!valorTexto) valorTexto = null;
            break;
          case '4': // Lista
            // Para campos de lista, envia o handle do item selecionado
            valorTexto = valorTexto || null;
            break;
          default:
            if (!valorTexto) valorTexto = null;
        }

        return {
          handleChecklistItem: item.HANDLE,
          observacao: itemValues[`obs_${item.HANDLE}`] || '',
          ...(valorTexto !== null && { valorTexto })
        };
      });

      await executarChecklist({
        checklist: params.handle as string,
        checklistItem: checklistItemData,
        anexoAssinaturaChecklist: [],
        anexoChecklist: []
      });
      
      // Interrompe o loading antes de mostrar o SweetAlert
      setSaving(false);
      
      // Mostra mensagem de sucesso com SweetAlert2 e aguarda o clique em OK
      const result = await Swal.fire({
        title: 'Sucesso!',
        text: 'Checklist salvo com sucesso!',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10B981',
        allowOutsideClick: false
      });

      // Só recarrega os itens se o usuário clicou em OK
      if (result.isConfirmed) {
        await loadChecklistItems(params.handle as string);
      }

    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      
      // Interrompe o loading antes de mostrar o erro
      setSaving(false);
      
      // Mostra mensagem de erro com SweetAlert2
      await Swal.fire({
        title: 'Erro!',
        text: 'Erro ao salvar o checklist. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Overlay de Loading */}
        {saving && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-700 text-lg font-medium">Salvando checklist...</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-opacity-95">
            <div className="mb-8 flex items-center">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-4 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Itens do Checklist
                </h1>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-6 bg-red-50 rounded-lg">
                <p className="font-medium">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center text-gray-600 p-6 bg-gray-50 rounded-lg">
                <p className="font-medium">Nenhum item encontrado para este checklist.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-12 py-4"></th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Observação</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Anexos</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {sortedItems.map((item) => (
                        <tr key={item.HANDLE} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <img 
                                src={`/assets/images/Item_checklist/${item.HANDLESTATUS}.png`}
                                alt={`Status ${item.HANDLESTATUS}`}
                                className="w-5 h-5 object-contain"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.NOME}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="w-48">
                              {renderInputField(item)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="w-48">
                              <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                                rows={1}
                                placeholder="Digite uma observação..."
                                value={itemValues[`obs_${item.HANDLE}`] || ''}
                                onChange={(e) => handleValueChange(`obs_${item.HANDLE}`, e.target.value)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openDropzone(item.HANDLE)}
                                className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                              >
                                <PaperClipIcon className="h-4 w-4 mr-2 text-gray-500" />
                                Anexar
                              </button>
                              {attachments[item.HANDLE]?.length > 0 && (
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                  {attachments[item.HANDLE].length} arquivo{attachments[item.HANDLE].length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {attachments[item.HANDLE]?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {attachments[item.HANDLE].map((file, index) => (
                                  <div key={index} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded-md text-sm text-gray-600">
                                    <span className="truncate flex-1">{file.name}</span>
                                    <button
                                      onClick={() => removeAttachment(item.HANDLE, index)}
                                      className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!loading && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 flex items-center space-x-2 shadow-md"
                >
                  <span>Salvar Checklist</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Transition appear show={isDropzoneOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDropzoneOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 mb-4"
                  >
                    Anexar Arquivos
                  </Dialog.Title>
                  <div
                    {...getRootProps()}
                    className="mt-2 border-2 border-dashed border-blue-200 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-200 cursor-pointer bg-blue-50/50"
                  >
                    <input {...getInputProps()} />
                    <p className="text-gray-600">
                      Arraste e solte arquivos aqui, ou clique para selecionar
                    </p>
                  </div>
                  {attachments[selectedItemHandle!]?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Arquivos selecionados:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {attachments[selectedItemHandle!].map((file, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            <span className="truncate flex-1">{file.name}</span>
                            <button
                              onClick={() => removeAttachment(selectedItemHandle!, index)}
                              className="ml-3 text-red-500 hover:text-red-700 transition-colors duration-200"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsDropzoneOpen(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setIsDropzoneOpen(false)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
                    >
                      Concluir
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
} 