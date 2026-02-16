require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { Resend } = require('resend');

const app = express();

// RESEND_API_KEY com fallback para teste
const RESEND_KEY = process.env.RESEND_API_KEY || 're_RaX3TyWa_P5Wa5fVTJkfTZm5AtnAUkH8A';
console.log('[STARTUP] Resend API Key configurada:', RESEND_KEY.substring(0, 8) + '...');
const resend = new Resend(RESEND_KEY);

// CORS: permite apenas o frontend configurado
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.ALLOWED_ORIGIN || 'https://soaf-mobile.web.app'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('[WARN] CORS bloqueado para origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI';
const SHEET_NAME = 'DADOS';
const SHEET_NAME_TAREFAS = 'ROTA DIA'; // Aba com ordens de serviço
const SHEET_NAME_RELATORIO = 'TOTAL DE SERVIÇOS'; // Aba com relatório de serviços executados
const SHEET_NAME_DESCONTOS = 'DESCONTOS'; // Aba com descontos
const SHEET_NAME_FECHAMENTO = 'Fechamento Prestadores'; // Aba com fechamento
const SHEET_NAME_LOGS = 'LOGS'; // Aba com logs de acesso

// Tenta múltiplos caminhos para o arquivo de credenciais
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  || (fs.existsSync('/etc/secrets/service-account.json') ? '/etc/secrets/service-account.json' : null)
  || (fs.existsSync('service-account.json') ? 'service-account.json' : null)
  || path.join(__dirname, 'service-account.json');

async function getPrestadores() {
  console.log('[INFO] getPrestadores() iniciado');
  
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    const err = 'Credenciais do service account não encontradas. Coloque server/service-account.json';
    console.error('[ERROR]', err);
    throw new Error(err);
  }
  console.log('[INFO] Arquivo service-account.json encontrado');

  try {
    const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    console.log('[INFO] JSON parseado. client_email:', cred.client_email);
    
    const client = new google.auth.JWT(
      cred.client_email,
      null,
      cred.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    console.log('[INFO] Cliente JWT criado');

    await client.authorize();
    console.log('[INFO] Autorização JWT bem-sucedida');
    
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('[INFO] Instância Google Sheets v4 criada');
    
    console.log('[INFO] Buscando dados da planilha ID:', SPREADSHEET_ID, 'Aba:', SHEET_NAME);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}`
    });

    const rows = res.data.values || [];
    console.log('[INFO] Total de linhas recebidas:', rows.length);
    
    if (rows.length === 0) {
      console.warn('[WARN] Nenhuma linha retornada pela planilha');
      return [];
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase());
    console.log('[INFO] Headers (colunas):', headers);
    console.log('[INFO] ⚠️ VERIFICAÇÃO: Coluna "primeiro_acesso" existe?', headers.includes('primeiro_acesso'));
    console.log('[INFO] ⚠️ VERIFICAÇÃO: Coluna "primeiro acesso" existe?', headers.includes('primeiro acesso'));
    console.log('[INFO] ⚠️ VERIFICAÇÃO: Índice da coluna CPF:', headers.indexOf('cpf'));
    console.log('[INFO] ⚠️ VERIFICAÇÃO: Índice da coluna SENHA:', headers.indexOf('senha'));
    
    const items = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });

    console.log('[INFO] Total de itens processados:', items.length);
    if (items.length > 0) {
      console.log('[INFO] Primeiro item (amostra):', JSON.stringify(items[0]));
      console.log('[INFO] ⚠️ Primeiro item - primeiro_acesso:', items[0].primeiro_acesso || items[0]['primeiro acesso'] || 'NÃO ENCONTRADO');
      console.log('[INFO] ⚠️ Primeiro item - cpf:', items[0].cpf || 'NÃO ENCONTRADO');
      console.log('[INFO] ⚠️ Primeiro item - senha:', items[0].senha ? '***' : 'NÃO ENCONTRADO');
    }

    return items;
  } catch (e) {
    console.error('[ERROR] Erro ao buscar prestadores:', e.message);
    console.error('[ERROR] Stack:', e.stack);
    throw e;
  }
}

// Função auxiliar para converter índice de coluna em letra (A, B, C, ..., Z, AA, AB, ...)
function columnToLetter(column) {
  let temp;
  let letter = '';
  while (column >= 0) {
    temp = column % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = Math.floor(column / 26) - 1;
  }
  return letter;
}

// Função auxiliar para escrever na planilha DADOS
async function updatePrestadorData(cnpj, updates) {
  console.log('[INFO] updatePrestadorData() iniciado para CNPJ:', cnpj);
  console.log('[INFO] Updates:', updates);
  
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('Credenciais do service account não encontradas');
  }

  try {
    const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const client = new google.auth.JWT(
      cred.client_email,
      null,
      cred.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    await client.authorize();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    // Busca dados atuais
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}`
    });

    const rows = res.data.values || [];
    if (rows.length === 0) {
      throw new Error('Planilha DADOS está vazia');
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase());
    console.log('[UPDATE] Headers da planilha:', headers);
    console.log('[UPDATE] ⚠️ Procurando coluna "primeiro_acesso":', headers.includes('primeiro_acesso') ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    console.log('[UPDATE] ⚠️ Procurando coluna "senha":', headers.includes('senha') ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
    
    const cnpjCol = headers.indexOf('cnpj');
    
    if (cnpjCol === -1) {
      throw new Error('Coluna CNPJ não encontrada na planilha');
    }

    // Encontra a linha do prestador
    const normalizeCnpj = (v) => String(v || '').replace(/\D/g, '');
    const targetCnpj = normalizeCnpj(cnpj);
    let targetRow = -1;
    
    for (let i = 1; i < rows.length; i++) {
      if (normalizeCnpj(rows[i][cnpjCol]) === targetCnpj) {
        targetRow = i + 1; // +1 porque sheets usa índice 1-based
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error(`CNPJ ${cnpj} não encontrado na planilha`);
    }

    console.log('[INFO] Prestador encontrado na linha:', targetRow);

    // Aplica atualizações
    const updateRequests = [];
    for (const [field, value] of Object.entries(updates)) {
      const colIndex = headers.indexOf(field.toLowerCase());
      if (colIndex !== -1) {
        const colLetter = columnToLetter(colIndex);
        const cell = `${colLetter}${targetRow}`; // Ex: B2, C2, AA2, AB2
        updateRequests.push({
          range: `${SHEET_NAME}!${cell}`,
          values: [[value]]
        });
        console.log(`[INFO] Agendando atualização: ${cell} = ${value}`);
      } else {
        console.warn(`[WARN] Campo '${field}' não encontrado nos headers da planilha`);
      }
    }

    if (updateRequests.length === 0) {
      console.warn('[WARN] Nenhuma coluna correspondente encontrada para atualização');
      return { ok: true, message: 'Nenhuma atualização necessária' };
    }

    // Executa atualizações em batch
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        valueInputOption: 'RAW',
        data: updateRequests
      }
    });

    console.log('[INFO] ✅ Planilha atualizada com sucesso');
    return { ok: true, message: 'Dados atualizados com sucesso', updates: updateRequests.length };

  } catch (e) {
    console.error('[ERROR] Erro ao atualizar prestador:', e.message);
    console.error('[ERROR] Stack:', e.stack);
    throw e;
  }
}

async function getTarefas() {
  console.log('[INFO] getTarefas() iniciado');
  
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    const err = 'Credenciais do service account não encontradas. Coloque server/service-account.json';
    console.error('[ERROR]', err);
    throw new Error(err);
  }
  console.log('[INFO] Arquivo service-account.json encontrado');

  try {
    const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    console.log('[INFO] JSON parseado. client_email:', cred.client_email);
    
    const client = new google.auth.JWT(
      cred.client_email,
      null,
      cred.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    console.log('[INFO] Cliente JWT criado');

    await client.authorize();
    console.log('[INFO] Autorização JWT bem-sucedida');
    
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('[INFO] Instância Google Sheets v4 criada');
    
    console.log('[INFO] Buscando dados da planilha ID:', SPREADSHEET_ID, 'Aba:', SHEET_NAME_TAREFAS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME_TAREFAS}`
    });

    const rows = res.data.values || [];
    console.log('[INFO] Total de linhas recebidas:', rows.length);
    
    if (rows.length === 0) {
      console.warn('[WARN] Nenhuma linha retornada pela planilha TAREFAS');
      return [];
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase());
    console.log('[INFO] Headers (colunas):', headers);
    
    const items = rows.slice(1).map((row, idx) => {
      const obj = { id: String(idx) };
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      // Normaliza CNPJ PRESTADOR para facilitar filtros
      if (obj['cnpj prestador']) {
        obj['cnpj prestador'] = String(obj['cnpj prestador'] || '').replace(/\D/g, '');
      }
      return obj;
    });

    console.log('[INFO] Total de itens processados:', items.length);
    if (items.length > 0) {
      console.log('[INFO] Primeiro item (amostra):', JSON.stringify(items[0]));
    }

    return items;
  } catch (e) {
    console.error('[ERROR] Erro ao buscar tarefas:', e.message);
    console.error('[ERROR] Stack:', e.stack);
    throw e;
  }
}

async function getRelatorio() {
  console.log('[INFO] getRelatorio() iniciado');
  
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    const err = 'Credenciais do service account não encontradas. Coloque server/service-account.json';
    console.error('[ERROR]', err);
    throw new Error(err);
  }
  console.log('[INFO] Arquivo service-account.json encontrado');

  try {
    const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    console.log('[INFO] JSON parseado. client_email:', cred.client_email);
    
    const client = new google.auth.JWT(
      cred.client_email,
      null,
      cred.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    console.log('[INFO] Cliente JWT criado');

    await client.authorize();
    console.log('[INFO] Autorização JWT bem-sucedida');
    
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('[INFO] Instância Google Sheets v4 criada');
    
    console.log('[INFO] Buscando dados da planilha ID:', SPREADSHEET_ID, 'Aba:', SHEET_NAME_RELATORIO);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME_RELATORIO}`
    });

    const rows = res.data.values || [];
    console.log('[INFO] Total de linhas recebidas:', rows.length);
    
    if (rows.length === 0) {
      console.warn('[WARN] Nenhuma linha retornada pela planilha TOTAL DE SERVIÇOS');
      return [];
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase());
    console.log('[INFO] Headers (colunas):', headers);
    
    const items = rows.slice(1).map((row, idx) => {
      const obj = { id: String(idx) };
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      // Normaliza CNPJ PRESTADOR para facilitar filtros
      if (obj['cnpj prestador']) {
        obj['cnpj prestador'] = String(obj['cnpj prestador'] || '').replace(/\D/g, '');
      }
      return obj;
    });

    console.log('[INFO] Total de itens processados:', items.length);
    if (items.length > 0) {
      console.log('[INFO] Primeiro item (amostra):', JSON.stringify(items[0]));
    }

    return items;
  } catch (e) {
    console.error('[ERROR] Erro ao buscar relatório:', e.message);
    console.error('[ERROR] Stack:', e.stack);
    throw e;
  }
}

async function getDescontos() {
  console.log('[INFO] getDescontos() iniciado');
  
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    const err = 'Credenciais do service account não encontradas. Coloque server/service-account.json';
    console.error('[ERROR]', err);
    throw new Error(err);
  }
  console.log('[INFO] Arquivo service-account.json encontrado');

  try {
    const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    console.log('[INFO] JSON parseado. client_email:', cred.client_email);
    
    const client = new google.auth.JWT(
      cred.client_email,
      null,
      cred.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    console.log('[INFO] Cliente JWT criado');

    await client.authorize();
    console.log('[INFO] Autorização JWT bem-sucedida');
    
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('[INFO] Instância Google Sheets v4 criada');
    
    console.log('[INFO] Buscando dados da planilha ID:', SPREADSHEET_ID, 'Aba:', SHEET_NAME_DESCONTOS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME_DESCONTOS}`
    });

    const rows = res.data.values || [];
    console.log('[INFO] Total de linhas recebidas:', rows.length);
    
    if (rows.length === 0) {
      console.warn('[WARN] Nenhuma linha retornada pela planilha DESCONTOS');
      return [];
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase());
    console.log('[INFO] Headers (colunas):', headers);
    
    const items = rows.slice(1).map((row, idx) => {
      const obj = { id: String(idx) };
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      // Normaliza CNPJ PRESTADOR para facilitar filtros
      if (obj['cnpj prestador']) {
        obj['cnpj prestador'] = String(obj['cnpj prestador'] || '').replace(/\D/g, '');
      }
      return obj;
    });

    console.log('[INFO] Total de itens processados:', items.length);
    if (items.length > 0) {
      console.log('[INFO] Primeiro item (amostra):', JSON.stringify(items[0]));
    }

    return items;
  } catch (e) {
    console.error('[ERROR] Erro ao buscar descontos:', e.message);
    console.error('[ERROR] Stack:', e.stack);
    throw e;
  }
}

async function getFechamento() {
  console.log('[INFO] getFechamento() iniciado');
  
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    const err = 'Credenciais do service account não encontradas. Coloque server/service-account.json';
    console.error('[ERROR]', err);
    throw new Error(err);
  }
  console.log('[INFO] Arquivo service-account.json encontrado');

  try {
    const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    console.log('[INFO] JSON parseado. client_email:', cred.client_email);
    
    const client = new google.auth.JWT(
      cred.client_email,
      null,
      cred.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    console.log('[INFO] Cliente JWT criado');

    await client.authorize();
    console.log('[INFO] Autorização JWT bem-sucedida');
    
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('[INFO] Instância Google Sheets v4 criada');
    
    console.log('[INFO] Buscando dados da planilha ID:', SPREADSHEET_ID, 'Aba:', SHEET_NAME_FECHAMENTO);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME_FECHAMENTO}`
    });

    const rows = res.data.values || [];
    console.log('[INFO] Total de linhas recebidas:', rows.length);
    
    if (rows.length === 0) {
      console.warn('[WARN] Nenhuma linha retornada pela planilha FECHAMENTO');
      return [];
    }

    const headers = rows[0].map(h => String(h || '').toLowerCase());
    console.log('[INFO] Headers (colunas):', headers);
    
    const items = rows.slice(1).map((row, idx) => {
      const obj = { id: String(idx) };
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      // Normaliza CNPJ para facilitar filtros (coluna "CNPJ" nesta aba)
      if (obj['cnpj']) {
        obj['cnpj'] = String(obj['cnpj'] || '').replace(/\D/g, '');
      }
      return obj;
    });

    console.log('[INFO] Total de itens processados:', items.length);
    if (items.length > 0) {
      console.log('[INFO] Primeiro item (amostra):', JSON.stringify(items[0]));
    }

    return items;
  } catch (e) {
    console.error('[ERROR] Erro ao buscar fechamento:', e.message);
    console.error('[ERROR] Stack:', e.stack);
    throw e;
  }
}

// Array para armazenar logs de acesso (em memória)
const accessLogs = [];
const MAX_LOGS = 500; // Manter últimos 500 acessos

// Middleware para registrar todos os acessos
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    origin: req.get('origin')
  };
  
  accessLogs.push(log);
  
  // Manter apenas os últimos MAX_LOGS registros
  if (accessLogs.length > MAX_LOGS) {
    accessLogs.shift();
  }
  
  console.log(`[ACCESS] ${timestamp} - ${req.method} ${req.path} - IP: ${log.ip}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend rodando' });
});

// Função para salvar log no Google Sheets
async function saveLogToSheet(logData) {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('[LOG ERROR] Credenciais não encontradas');
      return false;
    }

    const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const client = new google.auth.JWT(
      cred.client_email,
      null,
      cred.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    await client.authorize();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Formata os dados para inserir na planilha
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
    const horaFormatada = dataAtual.toLocaleTimeString('pt-BR');
    
    const row = [
      dataFormatada,
      horaFormatada,
      logData.tipo || 'ACESSO',
      logData.cnpj || '-',
      logData.nome || '-',
      logData.ip || '-',
      logData.acao || '-',
      logData.detalhes || '-'
    ];

    // Adiciona linha na aba LOGS
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME_LOGS}!A:H`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row]
      }
    });

    console.log('[LOG SHEETS] ✅ Log salvo na planilha');
    return true;
  } catch (e) {
    console.error('[LOG SHEETS ERROR]', e.message);
    return false;
  }
}

// Endpoint para registrar login (chamado pelo frontend)
app.post('/api/log-login', async (req, res) => {
  try {
    const { cnpj, nome, timestamp } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    const loginLog = {
      timestamp: timestamp || new Date().toISOString(),
      tipo: 'LOGIN',
      cnpj,
      nome,
      ip,
      acao: 'Acesso ao sistema',
      detalhes: 'Login realizado com sucesso'
    };
    
    console.log('[LOGIN] ✅', loginLog);
    
    // Salva na planilha em background
    saveLogToSheet(loginLog).catch(err => 
      console.error('[LOGIN] Erro ao salvar no Sheets:', err)
    );
    
    res.json({ ok: true });
  } catch (e) {
    console.error('[LOGIN ERROR]', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint para visualizar logs de acesso (protegido)
app.get('/api/access-logs', (req, res) => {
  try {
    // Retorna os últimos acessos
    const logs = accessLogs.slice(-100).reverse(); // Últimos 100, mais recentes primeiro
    
    res.json({ 
      ok: true, 
      total: accessLogs.length,
      logs 
    });
  } catch (e) {
    console.error('[LOGS ERROR]', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/prestadores', async (req, res) => {
  try {
    const items = await getPrestadores();
    res.json({ ok: true, items });
  } catch (e) {
    console.error('Erro ao buscar prestadores:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint para validar CPF do prestador
app.post('/api/validar-cpf', async (req, res) => {
  try {
    const { cnpj, cpf } = req.body;
    
    console.log('[VALIDAR-CPF] Requisição recebida');
    console.log('[VALIDAR-CPF] CNPJ:', cnpj);
    console.log('[VALIDAR-CPF] CPF:', cpf);
    
    if (!cnpj || !cpf) {
      return res.status(400).json({ ok: false, error: 'CNPJ e CPF são obrigatórios' });
    }

    console.log('[VALIDAR-CPF] Validando CPF para CNPJ:', cnpj);
    
    const prestadores = await getPrestadores();
    console.log('[VALIDAR-CPF] Total de prestadores:', prestadores.length);
    
    const normalizeCnpj = (v) => String(v || '').replace(/\D/g, '');
    const normalizeCpf = (v) => String(v || '').replace(/\D/g, '');
    
    const cnpjNorm = normalizeCnpj(cnpj);
    const cpfNorm = normalizeCpf(cpf);
    
    console.log('[VALIDAR-CPF] CNPJ normalizado:', cnpjNorm);
    console.log('[VALIDAR-CPF] CPF normalizado:', cpfNorm);
    
    const prestador = prestadores.find(p => normalizeCnpj(p.cnpj) === cnpjNorm);
    
    if (!prestador) {
      console.log('[VALIDAR-CPF] ❌ CNPJ não encontrado');
      return res.status(404).json({ ok: false, error: 'CNPJ não encontrado' });
    }
    
    console.log('[VALIDAR-CPF] Prestador encontrado:', prestador.nome || 'sem nome');
    const cpfCadastrado = normalizeCpf(prestador.cpf || '');
    console.log('[VALIDAR-CPF] CPF cadastrado:', cpfCadastrado);
    
    if (cpfCadastrado === cpfNorm) {
      console.log('[VALIDAR-CPF] ✅ CPF válido');
      return res.json({ ok: true, valid: true, message: 'CPF válido' });
    } else {
      console.log('[VALIDAR-CPF] ❌ CPF não corresponde');
      console.log('[VALIDAR-CPF] Esperado:', cpfCadastrado, 'Recebido:', cpfNorm);
      return res.json({ ok: true, valid: false, message: 'CPF não corresponde ao cadastrado' });
    }
    
  } catch (e) {
    console.error('[VALIDAR-CPF] Erro:', e.message);
    console.error('[VALIDAR-CPF] Stack:', e.stack);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint para atualizar senha do prestador
app.post('/api/atualizar-senha', async (req, res) => {
  try {
    const { cnpj, cpf, novaSenha } = req.body;
    
    console.log('[ATUALIZAR-SENHA] Requisição recebida');
    console.log('[ATUALIZAR-SENHA] CNPJ:', cnpj);
    console.log('[ATUALIZAR-SENHA] CPF:', cpf);
    console.log('[ATUALIZAR-SENHA] Nova senha length:', novaSenha?.length);
    
    if (!cnpj || !cpf || !novaSenha) {
      return res.status(400).json({ ok: false, error: 'CNPJ, CPF e nova senha são obrigatórios' });
    }

    if (novaSenha.length < 4) {
      return res.status(400).json({ ok: false, error: 'A senha deve ter no mínimo 4 caracteres' });
    }

    console.log('[ATUALIZAR-SENHA] Iniciando para CNPJ:', cnpj);
    
    // Valida CPF primeiro
    const prestadores = await getPrestadores();
    console.log('[ATUALIZAR-SENHA] Total de prestadores:', prestadores.length);
    
    const normalizeCnpj = (v) => String(v || '').replace(/\D/g, '');
    const normalizeCpf = (v) => String(v || '').replace(/\D/g, '');
    
    const cnpjNorm = normalizeCnpj(cnpj);
    const cpfNorm = normalizeCpf(cpf);
    
    console.log('[ATUALIZAR-SENHA] CNPJ normalizado:', cnpjNorm);
    console.log('[ATUALIZAR-SENHA] CPF normalizado:', cpfNorm);
    
    const prestador = prestadores.find(p => normalizeCnpj(p.cnpj) === cnpjNorm);
    
    if (!prestador) {
      console.log('[ATUALIZAR-SENHA] ❌ CNPJ não encontrado');
      return res.status(404).json({ ok: false, error: 'CNPJ não encontrado' });
    }
    
    console.log('[ATUALIZAR-SENHA] Prestador encontrado:', prestador.nome || 'sem nome');
    const cpfCadastrado = normalizeCpf(prestador.cpf || '');
    console.log('[ATUALIZAR-SENHA] CPF cadastrado:', cpfCadastrado);
    
    if (cpfCadastrado !== cpfNorm) {
      console.log('[ATUALIZAR-SENHA] ❌ CPF não corresponde');
      return res.status(403).json({ ok: false, error: 'CPF não corresponde ao cadastrado' });
    }
    
    // Atualiza senha e marca primeiro acesso como concluído
    console.log('[ATUALIZAR-SENHA] CPF válido, atualizando senha...');
    const result = await updatePrestadorData(cnpj, {
      senha: novaSenha,
      primeiro_acesso: 'NAO'
    });
    
    console.log('[ATUALIZAR-SENHA] ✅ Senha atualizada com sucesso');
    console.log('[ATUALIZAR-SENHA] Resultado:', result);
    res.json({ ok: true, message: 'Senha atualizada com sucesso' });
    
  } catch (e) {
    console.error('[ATUALIZAR-SENHA] ❌ Erro:', e.message);
    console.error('[ATUALIZAR-SENHA] Stack:', e.stack);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/tarefas', async (req, res) => {
  try {
    console.log('[ENDPOINT] /api/tarefas chamado');
    const items = await getTarefas();
    console.log('[ENDPOINT] Retornando', items.length, 'tarefas');
    res.json({ ok: true, items });
  } catch (e) {
    console.error('[ENDPOINT ERROR] Erro ao buscar tarefas:', e.message);
    console.error('[ENDPOINT ERROR] Stack:', e.stack);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/relatorio', async (req, res) => {
  try {
    const items = await getRelatorio();
    res.json({ ok: true, items });
  } catch (e) {
    console.error('Erro ao buscar relatório:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/descontos', async (req, res) => {
  try {
    const items = await getDescontos();
    res.json({ ok: true, items });
  } catch (e) {
    console.error('Erro ao buscar descontos:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/fechamento', async (req, res) => {
  try {
    const items = await getFechamento();
    res.json({ ok: true, items });
  } catch (e) {
    console.error('Erro ao buscar fechamento:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint para enviar email de aceite de agenda
app.post('/api/enviar-email-aceite', async (req, res) => {
  try {
    const { email, cnpj } = req.body;
    
    console.log('[INFO] Recebida requisição de aceite para:', email, 'CNPJ:', cnpj);
    
    if (!email || !cnpj) {
      return res.status(400).json({ ok: false, error: 'Email e CNPJ são obrigatórios' });
    }

    // Retorna resposta imediata para não travar o frontend
    res.json({ ok: true, message: 'Aceite registrado, email será enviado' });

    // Envia email em background (não bloqueia a resposta)
    const enviarEmailBackground = async () => {
      try {
        console.log('[ACEITE] ========== INÍCIO DO ENVIO DE EMAIL ==========');
        console.log('[ACEITE] Email destinatário recebido:', email);
        console.log('[ACEITE] CNPJ:', cnpj);
        console.log('[ACEITE] Resend Key configurada:', RESEND_KEY.substring(0, 8) + '...');
        
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR');

        const emailBody = `Prezado(a) Parceiro(a),

Confirmamos o aceite da Rota do Dia pelo CNPJ: ${cnpj}.

Data e Hora do Aceite: ${dataFormatada} ${horaFormatada}

Este e-mail serve como confirmação de que a rota de serviços para o dia foi revisada e aceita.

Evite duplicidade na informação, caso tenha dado rejeite da rota anteriormente sinalize o gestor da área confirmando que estará disponível para a rota.

Atenciosamente,
Sua Equipe de Suporte`;

        console.log('[ACEITE] Tentando enviar email via Resend...');
        console.log('[ACEITE] From: SOAF Mobile <onboarding@resend.dev>');
        console.log('[ACEITE] To:', email);
        console.log('[ACEITE] Subject: Confirmação de Aceite de Rota do Dia - CNPJ:', cnpj);
        
        const result = await resend.emails.send({
          from: 'SOAF Mobile <onboarding@resend.dev>',
          to: email,
          subject: `Confirmação de Aceite de Rota do Dia - CNPJ: ${cnpj}`,
          text: emailBody
        });
        
        console.log('[ACEITE] ✅✅✅ EMAIL ENVIADO COM SUCESSO! ✅✅✅');
        console.log('[ACEITE] Email ID retornado pelo Resend:', result.id);
        console.log('[ACEITE] Destinatário confirmado:', email);
        console.log('[ACEITE] CNPJ:', cnpj);
        console.log('[INFO] Data/Hora:', dataFormatada, horaFormatada);
        console.log('[INFO] Email ID:', result.id);
      } catch (emailError) {
        console.error('[ACEITE] ❌❌❌ FALHA AO ENVIAR EMAIL ❌❌❌');
        console.error('[ACEITE] Email que tentamos enviar:', email);
        console.error('[ACEITE] CNPJ:', cnpj);
        console.error('[ACEITE] Mensagem de erro:', emailError.message);
        console.error('[ACEITE] Código de erro:', emailError.code);
        console.error('[ACEITE] Nome do erro:', emailError.name);
        console.error('[ACEITE] Resposta Resend:', JSON.stringify(emailError.response?.data || 'sem resposta'));
        console.error('[ACEITE] Stack completo:', emailError.stack);
      }
    };

    // Executa em background sem esperar
    enviarEmailBackground();

  } catch (e) {
    console.error('[ERROR] Erro ao processar aceite:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint de TESTE para verificar se o envio de email está funcionando
app.get('/api/teste-email', async (req, res) => {
  try {
    console.log('[TEST] Iniciando teste de envio de email...');
    console.log('[TEST] RESEND_KEY configurada:', RESEND_KEY.substring(0, 8) + '...');
    
    if (!RESEND_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'RESEND_API_KEY não configurada',
        details: 'Configure a variável de ambiente RESEND_API_KEY no Render'
      });
    }
    
    // Envia email de teste
    const result = await resend.emails.send({
      from: 'SOAF Mobile <onboarding@resend.dev>',
      to: 'soaf.dados@gmail.com',
      subject: 'TESTE - Sistema SOAF Mobile',
      text: 'Este é um email de teste para verificar se o Resend está funcionando. Se você recebeu isso, o sistema está OK!'
    });

    console.log('[TEST] ✅ Email de teste enviado!');
    console.log('[TEST] Email ID:', result.id);

    res.json({ 
      ok: true, 
      message: 'Email de teste enviado com sucesso!',
      emailId: result.id,
      destinatario: 'soaf.dados@gmail.com'
    });

  } catch (error) {
    console.error('[TEST] ❌ ERRO no teste de email:');
    console.error('[TEST] Mensagem:', error.message);
    console.error('[TEST] Código:', error.code);
    console.error('[TEST] Nome:', error.name);
    console.error('[TEST] Resposta:', JSON.stringify(error.response?.data || error.response || 'sem resposta'));
    console.error('[TEST] Stack:', error.stack);
    
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      code: error.code,
      name: error.name,
      resendResponse: error.response?.data || null,
      details: 'Verifique os logs do servidor para mais detalhes'
    });
  }
});

// Endpoint para enviar email de rejeição de agenda
app.post('/api/enviar-email-rejeicao', async (req, res) => {
  try {
    const { email, cnpj } = req.body;
    
    if (!email || !cnpj) {
      return res.status(400).json({ ok: false, error: 'Email e CNPJ são obrigatórios' });
    }

    // Retorna resposta imediata
    res.json({ ok: true, message: 'Rejeição registrada, email será enviado' });

    // Envia email em background
    const enviarEmailBackground = async () => {
      try {
        console.log('[INFO] Iniciando envio de email de rejeição em background...');
        
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR');

        const emailBody = `Prezado(a) Parceiro(a),

❌ Rota do dia rejeitada, 

Data e Hora da Rejeição: ${dataFormatada} ${horaFormatada}

LAMENTAMOS NÃO PODER CONTAR CONTIGO HOJE, 

NOS AVISE ASSIM QUE ESTIVER DISPONÍVEL NOVAMENTE PARA PROGRAMARMOS ATIVIDADES PARA SUA EMPRESA.

Atenciosamente,
Sua Equipe de Suporte`;

        const result = await resend.emails.send({
          from: 'SOAF Mobile <onboarding@resend.dev>',
          to: email,
          subject: `Rejeição de Rota do Dia - CNPJ: ${cnpj}`,
          text: emailBody
        });
        
        console.log('[SUCCESS] ✅ Email de rejeição enviado com sucesso!');
        console.log('[INFO] Destinatário:', email);
        console.log('[INFO] CNPJ:', cnpj);
        console.log('[INFO] Data/Hora:', dataFormatada, horaFormatada);
        console.log('[INFO] Email ID:', result.id);
      } catch (emailError) {
        console.error('[ERROR] ❌ FALHA ao enviar email de rejeição (EVIDÊNCIA NÃO REGISTRADA)');
        console.error('[ERROR] Email destinatário:', email);
        console.error('[ERROR] CNPJ:', cnpj);
        console.error('[ERROR] Detalhes:', emailError.message);
        console.error('[ERROR] Stack:', emailError.stack);
      }
    };

    // Executa em background
    enviarEmailBackground();

  } catch (e) {
    console.error('[ERROR] Erro ao processar rejeição:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rota raiz - Status do servidor
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'SOAF Mobile Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      prestadores: '/api/prestadores',
      tarefas: '/api/tarefas',
      relatorio: '/api/relatorio',
      descontos: '/api/descontos',
      fechamento: '/api/fechamento',
      testeEmail: '/api/teste-email'
    },
    frontend: 'https://soaf-mobile.web.app'
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log('Backend URL: https://soaf-mobile-backend.onrender.com');
});
