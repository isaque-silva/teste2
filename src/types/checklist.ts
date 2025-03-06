export interface ChecklistItem {
  Handle: string;
  Codigo: string;
  NUMEROREFERENCIA: string;
  NUMEROPEDIDO: string;
  NUMEROCONTROLE: string;
  DATA: string;
  DATAINICIO: string;
  DATATERMINO: string;
  TRANSPORTADORA: string;
  HISTORICO: string;
  ROTEIRO: string;
  USUARIO: string;
  DATAALTERACAO: string;
  STATUS: string;
}

export interface ChecklistResponse {
  Dados: ChecklistItem[];
}

export interface ListItem {
  NOME: string;
  HANDLE: string;
  MARCADO: string;
}

export interface ChecklistItemDetail {
  HANDLE: string;
  ORDEM: string;
  NOME: string;
  STATUS: string;
  TIPOCAMPO: string;
  HANDLESTATUS: string;
  CONTEUDO: string;
  FORMATODATA: string;
  OBSERVACAO: string;
  Lista: ListItem[];
}

export interface ChecklistItemResponse {
  Dados: ChecklistItemDetail[];
} 