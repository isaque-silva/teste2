import Cookies from 'js-cookie';

interface AuthResponse {
  retorno: [{
    codigo: string;
    token: string;
  }];
}

export const login = async (username: string, password: string): Promise<string> => {
  try {
    // Formata as credenciais como "usuario:senha" e converte para base64
    const credentials = btoa(`${username}:${password}`);
    
    const response = await fetch('http://201.55.107.93:9090/escalasoft/Authorization', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Host': '201.55.107.93:9090',
        'User-Agent': 'ChecklistApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Usuário ou senha inválidos');
    }

    const data: AuthResponse = await response.json();
    const token = data.retorno[0].token;

    // Salva o token e o timestamp de quando foi gerado
    const tokenData = {
      value: token,
      timestamp: new Date().getTime()
    };
    
    // Cookie expira em 24 horas
    Cookies.set('token', JSON.stringify(tokenData), { expires: 1 });
    return token;
  } catch (error) {
    console.error('Erro no login:', error);
    Cookies.remove('token'); // Remove qualquer token existente
    throw new Error('Usuário ou senha inválidos');
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const tokenData = Cookies.get('token');
    if (!tokenData) return null;

    try {
      const { value, timestamp } = JSON.parse(tokenData);
      const now = new Date().getTime();
      const hoursPassed = (now - timestamp) / (1000 * 60 * 60);

      // Se passaram mais de 24 horas, remove o token e retorna null
      if (hoursPassed >= 24) {
        logout();
        return null;
      }

      return value;
    } catch {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const logout = (): void => {
  Cookies.remove('token');
  // Redireciona para a página de login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}; 