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
  process.env.ALLOWED_ORIGIN || 'https://knm-telecom.web.app'
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

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '16hFEaMWOagQ9rhIle9-Q4Jch08UQJXbzA4AdRV6HmJY';
const SHEET_NAME = 'DADOS';
const SHEET_NAME_TAREFAS = 'ROTA DIA'; // Aba com ordens de serviço
const SHEET_NAME_RELATORIO = 'TOTAL DE SERVIÇOS'; // Aba com relatório de serviços executados
const SHEET_NAME_DESCONTOS = 'DESCONTOS'; // Aba com descontos
const SHEET_NAME_FECHAMENTO = 'Fechamento Prestadores'; // Aba com fechamento
const SHEET_NAME_INDICADORES = 'INDICADORES'; // Aba com indicadores
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'service-account.json');

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
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
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
    
    const items = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });

    console.log('[INFO] Total de itens processados:', items.length);
    if (items.length > 0) {
      console.log('[INFO] Primeiro item (amostra):', JSON.stringify(items[0]));
    }

    return items;
  } catch (e) {
    console.error('[ERROR] Erro ao buscar prestadores:', e.message);
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

async function getIndicadores() {
  console.log('[INFO] getIndicadores() iniciado');

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

    console.log('[INFO] Buscando dados da planilha ID:', SPREADSHEET_ID, 'Aba:', SHEET_NAME_INDICADORES);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME_INDICADORES}`
    });

    const rows = res.data.values || [];
    console.log('[INFO] Total de linhas recebidas:', rows.length);

    if (rows.length === 0) {
      console.warn('[WARN] Nenhuma linha retornada pela planilha INDICADORES');
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
    console.error('[ERROR] Erro ao buscar indicadores:', e.message);
    console.error('[ERROR] Stack:', e.stack);
    throw e;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend rodando' });
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

app.get('/api/indicadores', async (req, res) => {
  try {
    const items = await getIndicadores();
    res.json({ ok: true, items });
  } catch (e) {
    console.error('Erro ao buscar indicadores:', e);
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
        console.log('[ACEITE] From: KNM Telecom <onboarding@resend.dev>');
        console.log('[ACEITE] To:', email);
        console.log('[ACEITE] Subject: Confirmação de Aceite de Rota do Dia - CNPJ:', cnpj);
        
        const result = await resend.emails.send({
          from: 'KNM Telecom <onboarding@resend.dev>',
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
      from: 'KNM Telecom <onboarding@resend.dev>',
      to: 'soaf.dados@gmail.com',
      subject: 'TESTE - Sistema KNM',
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
          from: 'KNM Telecom <onboarding@resend.dev>',
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
    service: 'KNM Telecom Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      prestadores: '/api/prestadores',
      tarefas: '/api/tarefas',
      relatorio: '/api/relatorio',
      descontos: '/api/descontos',
      fechamento: '/api/fechamento',
      indicadores: '/api/indicadores',
      emailAceite: '/api/enviar-email-aceite (POST)',
      emailRejeicao: '/api/enviar-email-rejeicao (POST)',
      testeEmail: '/api/teste-email'
    },
    frontend: 'https://knm-telecom.web.app'
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
