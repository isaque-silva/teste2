import { ChecklistResponse, ChecklistItemResponse } from '@/types/checklist';
import { getToken } from './auth';

export const getChecklists = async (): Promise<ChecklistResponse> => {
  const token = getToken();
  const response = await fetch('http://201.55.107.93:9090/escalasoft/qualidade/checklist/buscar', {
    method: 'GET',
    mode: 'no-cors',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    }
  });

  if (response.type === 'opaque') {
    return { Dados: [] };
  }

  return response.json();
};

export const getChecklistItems = async (handle: string): Promise<ChecklistItemResponse> => {
  const token = getToken();
  const response = await fetch(`http://201.55.107.93:9090/escalasoft/qualidade/checklist/item/buscar?handle=${handle}`, {
    method: 'GET',
    mode: 'no-cors',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    }
  });

  if (response.type === 'opaque') {
    return { Dados: [] };
  }

  return response.json();
};

interface ChecklistExecucao {
  checklist: string;
  checklistItem: Array<{
    handleChecklistItem: string;
    observacao: string;
    valorTexto?: string | number | boolean | null;
  }>;
  anexoAssinaturaChecklist: Array<{
    nomeArquivo: string;
    handleAssinatura: string;
    arquivoBase64: string;
  }>;
  anexoChecklist: any[];
}

export const executarChecklist = async (dados: ChecklistExecucao): Promise<void> => {
  const token = getToken();
  const response = await fetch('http://201.55.107.93:9090/escalasoft/qualidade/checklist/executar', {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });
}; 