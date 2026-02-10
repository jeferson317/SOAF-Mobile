import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, where, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { LogIn, Truck, CreditCard, DollarSign, Loader2, Zap, AlertTriangle, ArrowLeft, XCircle, BarChart3 } from 'lucide-react';

// --- CONFIGURAÇÃO E AUTENTICAÇÃO FIREBASE ---

// Variáveis globais fornecidas pelo ambiente (Obrigatórias)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'knm-telecom-app';

// 1. Configuração do Firebase.
// >>> SUAS CHAVES ATUALIZADAS E CORRIGIDAS (MANTIDAS DO SEU UPLOAD) <<<
const LOCAL_FIREBASE_CONFIG = {
    apiKey: "AIzaSyA19tqptiH9Fk2AtMUu-u-UpuSuUW0Q7ww", // SUA CHAVE
    authDomain: "knm-telecom.firebaseapp.com", // SEU DOMÍNIO
    projectId: "knm-telecom", // SEU PROJETO ID
    storageBucket: "knm-telecom.firebasestorage.app", // SEU STORAGE BUCKET
    messagingSenderId: "926379996626", // SEU SENDER ID
    appId: "1:926379996626:web:6d2b8067dbab6c9dd5440b" // SEU APP ID
};

// Se o ambiente Canvas injetar a configuração, tente parsear com segurança.
let firebaseConfig = LOCAL_FIREBASE_CONFIG;
if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
        const parsed = JSON.parse(__firebase_config);
        if (parsed && Object.keys(parsed).length > 0) {
            firebaseConfig = parsed;
        }
    } catch (e) {
        console.warn('Falha ao parsear __firebase_config injetado:', e);
        // mantém LOCAL_FIREBASE_CONFIG como fallback
    }
}

// Token de autenticação inicial (usado apenas no ambiente Canvas)
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Log leve de diagnóstico (não exibe chaves completas)
try {
    console.info('Firebase config used:', { projectId: firebaseConfig.projectId, apiKeyMask: firebaseConfig.apiKey ? `${String(firebaseConfig.apiKey).slice(0,6)}...` : undefined });
} catch (e) {
    // ignore
}


// --- COMPONENTES DE TELA ---

// Componente de Mensagem de Erro/Alerta
const AlertMessage = ({ message, type = 'error' }) => {
    const icon = type === 'error' ? <XCircle className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />;
    const color = type === 'error' ? 'bg-red-100 text-red-800 border-red-400' : 'bg-yellow-100 text-yellow-800 border-yellow-400';

    return (
        <div className={`p-3 border-l-4 rounded-md ${color} flex items-center mb-4 text-sm`} role="alert">
            {icon}
            <span className="font-medium">{message}</span>
        </div>
    );
};

// 1. Tela de Login
const LoginScreen = ({ setUserId, setError, setAppPhase, prestadores = [] }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [logoError, setLogoError] = useState(false);

    // Lógica de Login (simulada por enquanto)
    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Trata o login como CNPJ (apenas dígitos)
        const normalizeCnpj = (v) => String(v || '').replace(/\D/g, '');
        const cnpjNormalized = normalizeCnpj(login);

        // Busca prestador correspondente na lista carregada da planilha
        const found = prestadores.find(p => normalizeCnpj(p.cnpj) === cnpjNormalized);
        if (found) {
            const foundPass = String(found.senha || '').trim();
            const inputPass = String(password || '').trim();
            if (foundPass === inputPass) {
                setUserId(cnpjNormalized);
                setError(null);
                setAppPhase('dashboard');
            } else {
                setError('Senha incorreta.');
            }
        } else {
            setError('CNPJ não encontrado. Verifique os dados na planilha.');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
                <div className="text-center mb-8">
                    {logoError ? (
                        <Zap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    ) : (
                        <img
                            src="/knm-logo.png?v=2"
                            alt="KNM Telecom"
                            className="h-16 mx-auto mb-4 object-contain"
                            onError={() => setLogoError(true)}
                        />
                    )}
                    <p className="text-gray-600 font-medium">Acesso Prestador de Serviço</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ (apenas números)</label>
                            <input
                                type="tel"
                                value={login}
                                onChange={(e) => setLogin(e.target.value.replace(/\D/g, ''))}
                                placeholder="00000000000000"
                                maxLength={14}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                required
                            />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Aguarde...' : 'Entrar'}
                    </button>
                </form>
            </div>
            <p className="mt-6 text-xs text-gray-500">Desenvolvido para KNM Telecom - ID do App: {appId}</p>
        </div>
    );
};

// 2. Tela de Dashboard (Página principal após login)
const DashboardScreen = ({ userId, setAppPhase, setError, db, prestadorInfo }) => {
    const [tasks, setTasks] = useState([]);
    const [reportTasks, setReportTasks] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [closing, setClosing] = useState([]);
    const [indicadores, setIndicadores] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [firestoreError, setFirestoreError] = useState(null);
    const [creatingSample, setCreatingSample] = useState(false);
    const [activeTab, setActiveTab] = useState('rota'); // 'rota', 'relatorio', 'descontos' ou 'fechamento'
    const [logoErrorDash, setLogoErrorDash] = useState(false);
    const [agendaAceita, setAgendaAceita] = useState(null); // null = não respondeu, true = aceita, false = rejeitada
    const [enviandoEmail, setEnviandoEmail] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // URL do backend via variável de ambiente
    const BACKEND_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

    // Verificar se há aceite válido no localStorage (válido por 12 horas)
    useEffect(() => {
        const storageKey = `agenda_aceite_${userId}`;
        const aceiteData = localStorage.getItem(storageKey);
        
        if (aceiteData) {
            try {
                const { aceita, timestamp } = JSON.parse(aceiteData);
                const agora = new Date().getTime();
                const dozeHoras = 12 * 60 * 60 * 1000; // 12 horas em milissegundos
                
                // Verifica se o aceite ainda é válido (menos de 12 horas)
                if (agora - timestamp < dozeHoras) {
                    console.log('[INFO] Aceite válido encontrado no cache');
                    setAgendaAceita(aceita);
                } else {
                    console.log('[INFO] Aceite expirado, removendo cache');
                    localStorage.removeItem(storageKey);
                }
            } catch (e) {
                console.error('[ERROR] Erro ao ler cache de aceite:', e);
                localStorage.removeItem(storageKey);
            }
        }
    }, [userId]);

    // Dados de demo para testes locais (sem depender de Firestore)
    const DEMO_TASKS = [
        { id: '001', techId: userId, clientName: 'João Silva', address: 'Rua das Flores, 123 - São Paulo, SP', value: '150.00', type: 'Instalação' },
        { id: '002', techId: userId, clientName: 'Maria Oliveira', address: 'Av. Paulista, 1000 - São Paulo, SP', value: '85.00', type: 'Manutenção' },
        { id: '003', techId: userId, clientName: 'Empresa TechCorp', address: 'Rua Augusta, 456 - São Paulo, SP', value: '250.00', type: 'Ativação' },
        { id: '004', techId: userId, clientName: 'Comércio XYZ', address: 'Rua 25 de Março, 789 - São Paulo, SP', value: '120.00', type: 'Reparo' }
    ];

    // Endpoint de tarefas (a ser ajustado conforme sua estrutura de dados)
    // Para acesso público (shared data): /artifacts/{appId}/public/data/tasks
    const tasksCollectionPath = `artifacts/${appId}/public/data/tasks`; 

    useEffect(() => {
        // Busca tarefas/ordens da planilha Google (aba "rota do dia")
        // Filtra apenas ordens onde CNPJ PRESTADOR = CNPJ do usuário logado
        const fetchTasksFromSheet = async () => {
            try {
                // Normaliza CNPJ do usuário para comparação
                const userCnpj = String(userId || '').replace(/\D/g, '');
                console.log('[DEBUG] fetchTasksFromSheet iniciado para CNPJ:', userCnpj);

                // Busca APENAS pelo backend seguro (service account JSON)
                const backendRes = await fetch(`${BACKEND_URL}/api/tarefas`);
                if (!backendRes.ok) {
                    throw new Error(`Backend retornou erro: ${backendRes.status}`);
                }

                const json = await backendRes.json();
                if (!json || !Array.isArray(json.items)) {
                    throw new Error('Resposta do backend inválida');
                }

                console.log('[DEBUG] Tarefas carregadas do backend:', json.items.length);
                const tasksList = json.items
                    .map((t, idx) => ({
                        id: t.id || String(idx),
                        cnpjPrestador: String(t['cnpj prestador'] || t.cnpjprestador || '').replace(/\D/g, ''),
                        sa: t.sa || '',
                        clientName: t.cliente || '',
                        address: t.endereco || t.endereço || '',
                        type: t['tipo de serviço'] || t.tipo || '',
                        date: t.data || '',
                        prazoMax: t['prazo max'] || t.prazo || '',
                        statusSf: t['status sf'] || t.status || '',
                        planClient: t['plano do cliente'] || t.plano || '',
                        phone: t.telefone || ''
                    }))
                    .filter(t => t.cnpjPrestador === userCnpj);

                console.log('[DEBUG] Tarefas filtradas para CNPJ', userCnpj + ':', tasksList.length);
                setTasks(tasksList);
                setLastUpdate(new Date());
                setIsLoading(false);
                setFirestoreError(null);
            } catch (e) {
                console.error('[ERROR] Erro ao carregar tarefas:', e);
                setFirestoreError(`Erro ao carregar ordens: ${e.message}`);
                setTasks([]);
                setIsLoading(false);
            }
        };

        fetchTasksFromSheet();
        fetchReportFromSheet();
        fetchDiscountsFromSheet();
        fetchClosingFromSheet();
        fetchIndicadoresFromSheet();
    }, [userId]);

    // Função para atualizar todos os dados manualmente
    const refreshAllData = async () => {
        setIsRefreshing(true);
        setFirestoreError(null);
        try {
            await Promise.all([
                fetchTasksFromSheet(),
                fetchReportFromSheet(),
                fetchDiscountsFromSheet(),
                fetchClosingFromSheet(),
                fetchIndicadoresFromSheet()
            ]);
            console.log('[INFO] ✅ Dados atualizados com sucesso!');
        } catch (e) {
            console.error('[ERROR] Erro ao atualizar dados:', e);
            setFirestoreError('Erro ao atualizar dados. Tente novamente.');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Auto-refresh a cada 5 minutos
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('[INFO] 🔄 Auto-refresh iniciado (5 minutos)');
            refreshAllData();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [userId]);

    // Busca relatório de serviços executados (aba "TOTAL DE SERVIÇOS")
    const fetchReportFromSheet = async () => {
        try {
            // Normaliza CNPJ do usuário para comparação
            const userCnpj = String(userId || '').replace(/\D/g, '');
            console.log('[DEBUG] fetchReportFromSheet iniciado para CNPJ:', userCnpj);

            // Busca APENAS pelo backend seguro (service account JSON)
            const backendRes = await fetch(`${BACKEND_URL}/api/relatorio`);
            if (!backendRes.ok) {
                throw new Error(`Backend retornou erro: ${backendRes.status}`);
            }

            const json = await backendRes.json();
            if (!json || !Array.isArray(json.items)) {
                throw new Error('Resposta do backend inválida');
            }

            console.log('[DEBUG] Relatório carregado do backend:', json.items.length);
            const reportList = json.items
                .map((t, idx) => ({
                    id: t.id || String(idx),
                    cnpjPrestador: String(t['cnpj prestador'] || t.cnpjprestador || '').replace(/\D/g, ''),
                    sa: t.sa || '',
                    clientName: t.cliente || '',
                    address: t.endereco || t.endereço || '',
                    type: t['tipo de serviço'] || t.tipo || '',
                    dateClose: t['data encerramento'] || t.dataencerramento || '',
                    value: t.valor || ''
                }))
                .filter(t => t.cnpjPrestador === userCnpj);

            console.log('[DEBUG] Relatório filtrado para CNPJ', userCnpj + ':', reportList.length);
            setReportTasks(reportList);
        } catch (e) {
            console.error('[ERROR] Erro ao carregar relatório:', e);
            setReportTasks([]);
        }
    };

    // Busca descontos (aba "DESCONTOS")
    const fetchDiscountsFromSheet = async () => {
        try {
            // Normaliza CNPJ do usuário para comparação
            const userCnpj = String(userId || '').replace(/\D/g, '');
            console.log('[DEBUG] fetchDiscountsFromSheet iniciado para CNPJ:', userCnpj);

            // Busca APENAS pelo backend seguro (service account JSON)
            const backendRes = await fetch(`${BACKEND_URL}/api/descontos`);
            if (!backendRes.ok) {
                throw new Error(`Backend retornou erro: ${backendRes.status}`);
            }

            const json = await backendRes.json();
            if (!json || !Array.isArray(json.items)) {
                throw new Error('Resposta do backend inválida');
            }

            console.log('[DEBUG] Descontos carregados do backend:', json.items.length);
            const discountList = json.items
                .map((d, idx) => ({
                    id: d.id || String(idx),
                    cnpjPrestador: String(d['cnpj prestador'] || d.cnpjprestador || d.cnpj || '').replace(/\D/g, ''),
                    desconto: d.desconto || '',
                    valor: d.valor || '',
                    data: d.data || ''
                }))
                .filter(d => d.cnpjPrestador === userCnpj && d.desconto.trim() !== '');

            console.log('[DEBUG] Descontos filtrados para CNPJ', userCnpj + ':', discountList.length);
            setDiscounts(discountList);
        } catch (e) {
            console.error('[ERROR] Erro ao carregar descontos:', e);
            setDiscounts([]);
        }
    };

    // Busca fechamento/resumo (aba "Fechamento Prestadores")
    const fetchClosingFromSheet = async () => {
        try {
            // Normaliza CNPJ do usuário para comparação
            const userCnpj = String(userId || '').replace(/\D/g, '');
            console.log('[DEBUG] fetchClosingFromSheet iniciado para CNPJ:', userCnpj);

            // Busca APENAS pelo backend seguro (service account JSON)
            const backendRes = await fetch(`${BACKEND_URL}/api/fechamento`);
            if (!backendRes.ok) {
                throw new Error(`Backend retornou erro: ${backendRes.status}`);
            }

            const json = await backendRes.json();
            if (!json || !Array.isArray(json.items)) {
                throw new Error('Resposta do backend inválida');
            }

            console.log('[DEBUG] Fechamento carregado do backend:', json.items.length);
            console.log('[DEBUG] Colunas do primeiro item:', json.items[0] ? Object.keys(json.items[0]) : []);

            const closingList = json.items
                .map((c, idx) => ({
                    id: c.id || String(idx),
                    // Tenta várias variações do campo CNPJ
                    cnpjPrestador: String(c.cnpj || c['cnpj'] || c['cnpj prestador'] || c.cnpjprestador || '').replace(/\D/g, ''),
                    valorServicos: c['valor dos serviços'] || c.valorservicos || c['valor dos servicos'] || '0',
                    descontos: c.descontos || '0',
                    valorReceber: c['valor a receber'] || c.valorareceber || c['valor a receber'] || '0'
                }))
                .filter(c => c.cnpjPrestador === userCnpj);

            console.log('[DEBUG] Fechamento filtrado para CNPJ', userCnpj + ':', closingList.length);
            if (closingList.length > 0) {
                console.log('[DEBUG] Primeiro item filtrado:', closingList[0]);
            }
            setClosing(closingList);
        } catch (e) {
            console.error('[ERROR] Erro ao carregar fechamento:', e);
            setClosing([]);
        }
    };

    // Busca indicadores (aba "INDICADORES")
    const fetchIndicadoresFromSheet = async () => {
        try {
            const userCnpj = String(userId || '').replace(/\D/g, '');
            console.log('[DEBUG] fetchIndicadoresFromSheet iniciado para CNPJ:', userCnpj);

            const backendRes = await fetch(`${BACKEND_URL}/api/indicadores`);
            if (!backendRes.ok) {
                throw new Error(`Backend retornou erro: ${backendRes.status}`);
            }

            const json = await backendRes.json();
            if (!json || !Array.isArray(json.items)) {
                throw new Error('Resposta do backend inválida');
            }

            console.log('[DEBUG] Indicadores carregados do backend:', json.items.length);
            if (json.items.length > 0) {
                console.log('[DEBUG] Colunas do primeiro item:', Object.keys(json.items[0]));
            }

            const indicadoresList = json.items
                .map((item, idx) => ({
                    id: item.id || String(idx),
                    cnpjPrestador: String(item['cnpj prestador'] || item.cnpjprestador || item.cnpj || '').replace(/\D/g, ''),
                    caAtivacao: item['ca ativação'] || item['ca ativacao'] || '',
                    caMudEndereco: item['ca mud. de end.'] || item['ca mud de end'] || item['ca mud. de end'] || '',
                    ifi: item['ifi'] || '',
                    app: item['app'] || '',
                    notaIpo: item['nota ipo'] || ''
                }))
                .filter(item => item.cnpjPrestador === userCnpj);

            console.log('[DEBUG] Indicadores filtrados para CNPJ', userCnpj + ':', indicadoresList.length);
            setIndicadores(indicadoresList);
        } catch (e) {
            console.error('[ERROR] Erro ao carregar indicadores:', e);
            setIndicadores([]);
        }
    };

    const handleAceitarAgenda = async () => {
        // Aceite instantâneo - não espera email
        setAgendaAceita(true);
        setFirestoreError(null);
        
        // Salvar aceite no localStorage com timestamp (válido por 12 horas)
        const storageKey = `agenda_aceite_${userId}`;
        const aceiteData = {
            aceita: true,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(storageKey, JSON.stringify(aceiteData));
        console.log('[INFO] Aceite salvo no cache por 12 horas');
        
        // Enviar email em background (não bloqueia a interface)
        const enviarEmailBackground = async () => {
            try {
                console.log('[DEBUG] Dados do prestador:', prestadorInfo);
                const email = prestadorInfo?.['e-mail'] || prestadorInfo?.email || '';
                console.log('[DEBUG] Email extraído:', email);
                
                if (!email) {
                    console.error('[ERROR] ❌ Email do prestador não encontrado! Impossível enviar evidência.');
                    return;
                }
                
                const url = `${BACKEND_URL}/api/enviar-email-aceite`;
                console.log('[DEBUG] Enviando para:', url);
                console.log('[DEBUG] Payload:', { email, cnpj: userId });
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, cnpj: userId })
                });
                
                console.log('[DEBUG] Status da resposta:', response.status);
                const data = await response.json();
                console.log('[DEBUG] Resposta do backend:', data);
                
                if (response.ok) {
                    console.log('[SUCCESS] ✅ Email de aceite enviado com sucesso!');
                } else {
                    console.error('[ERROR] ❌ Backend retornou erro:', data);
                }
            } catch (e) {
                console.error('[ERROR] ❌ Falha ao enviar email de aceite:', e.message);
                console.error('[ERROR] Stack:', e.stack);
            }
        };
        
        // Executa em background sem bloquear
        enviarEmailBackground();
    };

    const handleRejeitarAgenda = async () => {
        // Rejeição instantânea
        setAgendaAceita(false);
        setFirestoreError(null);
        
        // Remover aceite do localStorage ao rejeitar
        const storageKey = `agenda_aceite_${userId}`;
        localStorage.removeItem(storageKey);
        console.log('[INFO] Cache de aceite removido');
        
        // Enviar email em background (não bloqueia)
        const enviarEmailBackground = async () => {
            try {
                console.log('[DEBUG] Dados do prestador:', prestadorInfo);
                const email = prestadorInfo?.['e-mail'] || prestadorInfo?.email || '';
                console.log('[DEBUG] Email extraído:', email);
                
                if (!email) {
                    console.error('[ERROR] ❌ Email do prestador não encontrado! Impossível enviar evidência.');
                    return;
                }
                
                const url = `${BACKEND_URL}/api/enviar-email-rejeicao`;
                console.log('[DEBUG] Enviando para:', url);
                console.log('[DEBUG] Payload:', { email, cnpj: userId });
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, cnpj: userId })
                });
                
                console.log('[DEBUG] Status da resposta:', response.status);
                const data = await response.json();
                console.log('[DEBUG] Resposta do backend:', data);
                
                if (response.ok) {
                    console.log('[SUCCESS] ✅ Email de rejeição enviado com sucesso!');
                } else {
                    console.error('[ERROR] ❌ Backend retornou erro:', data);
                }
            } catch (e) {
                console.error('[ERROR] ❌ Falha ao enviar email de rejeição:', e.message);
                console.error('[ERROR] Stack:', e.stack);
            }
        };
        
        // Executa em background
        enviarEmailBackground();
    };

    const handleLogout = () => {
        setAppPhase('login');
        setError(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="mt-3 text-gray-600">Carregando tarefas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            {/* Header com botões sair e atualizar */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={refreshAllData}
                        disabled={isRefreshing}
                        className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150 bg-white px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Loader2 className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
                    </button>
                    {lastUpdate && (
                        <span className="text-xs text-gray-500">
                            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                        </span>
                    )}
                </div>
                <button 
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition duration-150 bg-white px-4 py-2 rounded-lg shadow"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Sair
                </button>
            </div>

            {/* Card de informações do prestador */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <div className="flex items-center mb-4">
                    {logoErrorDash ? (
                        <Truck className="w-10 h-10 text-blue-600 mr-3" />
                    ) : (
                        <img
                            src="/knm-logo.png"
                            alt="KNM Telecom"
                            className="h-10 w-auto mr-3 object-contain"
                            onError={() => setLogoErrorDash(true)}
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800">
                            {prestadorInfo?.nome || prestadorInfo?.['login sistema'] || 'Prestador'}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            CNPJ: {String(userId || '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                        </p>
                    </div>
                </div>

                {/* Botões de navegação - Grid responsivo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <button
                        onClick={() => setActiveTab('rota')}
                        className={`p-4 rounded-lg border-2 transition duration-150 ${
                            activeTab === 'rota'
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                    >
                        <div className="text-center">
                            <Truck className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-semibold text-sm">Rota do Dia</p>
                            <p className="text-2xl font-bold">{tasks.length}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('relatorio')}
                        className={`p-4 rounded-lg border-2 transition duration-150 ${
                            activeTab === 'relatorio'
                                ? 'border-green-600 bg-green-50 text-green-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                        }`}
                    >
                        <div className="text-center">
                            <CreditCard className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-semibold text-sm">Executados</p>
                            <p className="text-2xl font-bold">{reportTasks.length}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('descontos')}
                        className={`p-4 rounded-lg border-2 transition duration-150 ${
                            activeTab === 'descontos'
                                ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
                        }`}
                    >
                        <div className="text-center">
                            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-semibold text-sm">Descontos</p>
                            <p className="text-2xl font-bold">{discounts.length}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('fechamento')}
                        className={`p-4 rounded-lg border-2 transition duration-150 ${
                            activeTab === 'fechamento'
                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                    >
                        <div className="text-center">
                            <DollarSign className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-semibold text-sm">Fechamento</p>
                            <p className="text-2xl font-bold">{closing.length}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('indicadores')}
                        className={`p-4 rounded-lg border-2 transition duration-150 ${
                            activeTab === 'indicadores'
                                ? 'border-teal-600 bg-teal-50 text-teal-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50'
                        }`}
                    >
                        <div className="text-center">
                            <BarChart3 className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-semibold text-sm">Indicadores</p>
                            <p className="text-2xl font-bold">{indicadores.length}</p>
                        </div>
                    </button>
                </div>
            </div>

            {firestoreError && <AlertMessage message={firestoreError} type="error" />}

            <div className="bg-white p-6 rounded-xl shadow-lg">
                {/* Aba: Rota do Dia */}
                {activeTab === 'rota' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Minhas Ordens de Serviço ({tasks.length})</h2>
                
                {/* Botões Aceitar/Rejeitar Agenda */}
                {agendaAceita === null && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
                            Confirmação de Agenda
                        </h3>
                        <p className="text-gray-700 mb-4">
                            Para visualizar suas ordens de serviço, confirme se aceita ou rejeita a agenda do dia:
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleAceitarAgenda}
                                disabled={enviandoEmail}
                                className="flex-1 flex items-center justify-center py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {enviandoEmail ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <CreditCard className="w-5 h-5 mr-2" />
                                )}
                                Aceitar Agenda
                            </button>
                            <button
                                onClick={handleRejeitarAgenda}
                                disabled={enviandoEmail}
                                className="flex-1 flex items-center justify-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {enviandoEmail ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <XCircle className="w-5 h-5 mr-2" />
                                )}
                                Rejeitar Agenda
                            </button>
                        </div>
                    </div>
                )}

                {/* Mensagem de agenda aceita */}
                {agendaAceita === true && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800">
                        <p className="font-semibold">✅ Agenda Aceita com Sucesso!</p>
                        <p className="text-sm mt-1">Um email de confirmação foi enviado. Suas ordens de serviço estão listadas abaixo.</p>
                    </div>
                )}

                {/* Mensagem de agenda rejeitada */}
                {agendaAceita === false && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800">
                        <p className="font-semibold">❌ Agenda Rejeitada</p>
                        <p className="text-sm mt-1">Você rejeitou a agenda do dia. Entre em contato com o gestor quando estiver disponível.</p>
                    </div>
                )}

                {/* Exibir tarefas apenas se agenda foi aceita */}
                {agendaAceita === true && tasks.length === 0 && (
                    <p className="text-gray-500">Nenhuma ordem de serviço encontrada. Contate o administrador do sistema.</p>
                )}
                
                {agendaAceita === true && tasks.length > 0 && (
                    <>
                    {/* Resumo por tipo de serviço */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Resumo por Tipo de Serviço</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {Object.entries(
                                tasks.reduce((acc, task) => {
                                    const tipo = task.type || 'Não informado';
                                    acc[tipo] = (acc[tipo] || 0) + 1;
                                    return acc;
                                }, {})
                            )
                            .sort((a, b) => b[1] - a[1])
                            .map(([tipo, count]) => (
                                <div key={tipo} className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                                    <p className="text-xs text-gray-600 font-medium truncate" title={tipo}>{tipo}</p>
                                    <p className="text-2xl font-bold text-blue-600">{count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {tasks.map(task => {
                            // Define cor do card baseado no status
                            const statusNorm = String(task.statusSf || '').toLowerCase().trim();
                            let cardBgColor = 'bg-white hover:bg-gray-50'; // padrão
                            let borderColor = 'border-gray-200';
                            
                            if (statusNorm.includes('concluída') || statusNorm.includes('concluida')) {
                                cardBgColor = 'bg-green-50 hover:bg-green-100';
                                borderColor = 'border-green-200';
                            } else if (statusNorm.includes('em execução') || statusNorm.includes('em execucao') || statusNorm.includes('execução')) {
                                cardBgColor = 'bg-yellow-50 hover:bg-yellow-100';
                                borderColor = 'border-yellow-200';
                            } else if (statusNorm.includes('agendado')) {
                                cardBgColor = 'bg-blue-50 hover:bg-blue-100';
                                borderColor = 'border-blue-200';
                            } else if (statusNorm.includes('despachado')) {
                                cardBgColor = 'bg-blue-100 hover:bg-blue-200';
                                borderColor = 'border-blue-300';
                            }

                            return (
                            <div key={task.id} className={`p-4 border rounded-lg shadow-sm transition duration-150 ${borderColor} ${cardBgColor}`}>
                                <p className="font-bold text-gray-800">SA #{task.sa} - <span className="text-blue-600">{task.clientName}</span></p>
                                
                                {/* Endereço com link para Google Maps */}
                                <p className="text-sm text-gray-600">
                                    Endereço:{' '}
                                    {task.address ? (
                                        <a
                                            href={`https://www.google.com/maps/search/${encodeURIComponent(task.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            {task.address}
                                        </a>
                                    ) : (
                                        'Não informado'
                                    )}
                                </p>
                                
                                {/* Telefone com link para chamada/WhatsApp */}
                                <p className="text-sm text-gray-600">
                                    Telefone:{' '}
                                    {task.phone ? (
                                        <a
                                            href={`tel:${task.phone}`}
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium mr-2"
                                        >
                                            {task.phone}
                                        </a>
                                    ) : (
                                        'Não informado'
                                    )}
                                    {task.phone && (
                                        <a
                                            href={`https://wa.me/${String(task.phone).replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Enviar mensagem WhatsApp"
                                            className="text-green-600 hover:text-green-800 hover:underline text-xs font-medium"
                                        >
                                            (WhatsApp)
                                        </a>
                                    )}
                                </p>

                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div className="flex items-center text-indigo-600">
                                        <CreditCard className="w-4 h-4 mr-1" /> <span className="font-medium">Tipo:</span> {task.type}
                                    </div>
                                    <div className="text-gray-700">
                                        <span className="font-medium">Data:</span> {task.date}
                                    </div>
                                    <div className="text-gray-700">
                                        <span className="font-medium">Prazo Max:</span> {task.prazoMax}
                                    </div>
                                    <div className="text-gray-700">
                                        <span className="font-medium">Status:</span> {task.statusSf}
                                    </div>
                                    <div className="text-gray-700 col-span-2">
                                        <span className="font-medium">Plano:</span> {task.planClient}
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                    </>
                )}
                    </div>
                )}

                {/* Aba: Relatório de Serviços Executados */}
                {activeTab === 'relatorio' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Serviços Executados ({reportTasks.length})</h2>
                        
                        {reportTasks.length === 0 ? (
                            <p className="text-gray-500">Nenhum serviço executado encontrado.</p>
                        ) : (
                            <>
                            {/* Resumo por tipo de serviço */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Resumo por Tipo de Serviço</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {Object.entries(
                                        reportTasks.reduce((acc, task) => {
                                            const tipo = task.type || 'Não informado';
                                            acc[tipo] = (acc[tipo] || 0) + 1;
                                            return acc;
                                        }, {})
                                    )
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([tipo, count]) => (
                                        <div key={tipo} className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                                            <p className="text-xs text-gray-600 font-medium truncate" title={tipo}>{tipo}</p>
                                            <p className="text-2xl font-bold text-green-600">{count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {reportTasks.map(task => (
                                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-green-50 transition duration-150">
                                        <p className="font-bold text-gray-800">SA #{task.sa} - <span className="text-green-600">{task.clientName}</span></p>
                                        
                                        {/* Endereço com link para Google Maps */}
                                        <p className="text-sm text-gray-600">
                                            Endereço:{' '}
                                            {task.address ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/${encodeURIComponent(task.address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                                >
                                                    {task.address}
                                                </a>
                                            ) : (
                                                'Não informado'
                                            )}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                            <div className="flex items-center text-indigo-600">
                                                <CreditCard className="w-4 h-4 mr-1" /> <span className="font-medium">Tipo:</span> {task.type}
                                            </div>
                                            <div className="text-gray-700">
                                                <span className="font-medium">Data Encerr.:</span> {task.dateClose}
                                            </div>
                                            <div className="text-green-700 font-medium col-span-2">
                                                <DollarSign className="w-4 h-4 inline mr-1" /> Valor: R$ {task.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </>
                        )}
                    </div>
                )}

                {/* Aba: Descontos */}
                {activeTab === 'descontos' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Meus Descontos ({discounts.length})</h2>
                        
                        {discounts.length === 0 ? (
                            <p className="text-gray-500">Nenhum desconto encontrado.</p>
                        ) : (
                            <div className="space-y-4">
                                {discounts.map(discount => (
                                    <div key={discount.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-yellow-50 transition duration-150">
                                        <p className="font-bold text-gray-800">
                                            <span className="text-yellow-600">{discount.desconto}</span>
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                            <div className="text-green-700 font-medium">
                                                <DollarSign className="w-4 h-4 inline mr-1" /> Valor: R$ {discount.valor}
                                            </div>
                                            <div className="text-gray-700">
                                                <span className="font-medium">Data:</span> {discount.data}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Aba: Fechamento */}
                {activeTab === 'fechamento' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Fechamento ({closing.length})</h2>
                        
                        {closing.length === 0 ? (
                            <p className="text-gray-500">Nenhum fechamento encontrado.</p>
                        ) : (
                            <div className="space-y-4">
                                {closing.map(close => (
                                    <div key={close.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-purple-50 transition duration-150">
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div className="bg-blue-50 p-3 rounded">
                                                <p className="font-bold text-blue-700">Valor Serviços</p>
                                                <p className="text-lg font-extrabold text-blue-600">R$ {close.valorServicos}</p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded">
                                                <p className="font-bold text-red-700">Descontos</p>
                                                <p className="text-lg font-extrabold text-red-600">R$ {close.descontos}</p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded">
                                                <p className="font-bold text-green-700">Total a Receber</p>
                                                <p className="text-lg font-extrabold text-green-600">R$ {close.valorReceber}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Aba: Indicadores */}
                {activeTab === 'indicadores' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Indicadores ({indicadores.length})</h2>

                        {indicadores.length === 0 ? (
                            <p className="text-gray-500">Nenhum indicador encontrado.</p>
                        ) : (
                            <div className="space-y-4">
                                {indicadores.map(ind => (
                                    <div key={ind.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-teal-50 transition duration-150">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
                                            <div className="bg-blue-50 p-3 rounded">
                                                <p className="font-bold text-blue-700 text-xs">CA Ativacao</p>
                                                <p className="text-lg font-extrabold text-blue-600">{ind.caAtivacao || '-'}</p>
                                            </div>
                                            <div className="bg-indigo-50 p-3 rounded">
                                                <p className="font-bold text-indigo-700 text-xs">CA Mud. de End.</p>
                                                <p className="text-lg font-extrabold text-indigo-600">{ind.caMudEndereco || '-'}</p>
                                            </div>
                                            <div className="bg-purple-50 p-3 rounded">
                                                <p className="font-bold text-purple-700 text-xs">IFI</p>
                                                <p className="text-lg font-extrabold text-purple-600">{ind.ifi || '-'}</p>
                                            </div>
                                            <div className="bg-teal-50 p-3 rounded">
                                                <p className="font-bold text-teal-700 text-xs">APP</p>
                                                <p className="text-lg font-extrabold text-teal-600">{ind.app || '-'}</p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded">
                                                <p className="font-bold text-green-700 text-xs">Nota IPO</p>
                                                <p className="text-lg font-extrabold text-green-600">{ind.notaIpo || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


// 3. Componente Principal do Aplicativo
const App = () => {
    // Estado de Fases: 'loading', 'login', 'dashboard'
    const [appPhase, setAppPhase] = useState('loading'); 
    const [userId, setUserId] = useState(null);
    const [error, setError] = useState(null);
    
    // Instâncias do Firebase
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [prestadores, setPrestadores] = useState([]);
    const [sheetError, setSheetError] = useState(null);

    // 1. Inicializa o Firebase e a Autenticação
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            
            setDb(dbInstance);
            setAuth(authInstance);

            // Tenta autenticar
            const authenticate = async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setAppPhase('login');
                } else if (initialAuthToken) {
                    // Autenticação Custom Token (apenas para ambiente Canvas)
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    // *** MUDANÇA CRÍTICA: NO AMBIENTE LOCAL, PULAMOS A AUTENTICAÇÃO ANÔNIMA QUE ESTAVA FALHANDO ***
                    // O app irá direto para a tela de login para usar o login simulado.
                    setAppPhase('login'); 
                }
                setIsAuthReady(true);
            };
            
            // Monitora o estado de autenticação
            const unsubscribe = onAuthStateChanged(authInstance, (user) => {
                if (user) {
                    setUserId(user.uid);
                    setAppPhase('login'); 
                } else {
                    if(isAuthReady) {
                        setAppPhase('login');
                        setUserId(null);
                    } else {
                        // Tenta autenticar pela primeira vez (ou vai para o login simulado)
                        authenticate(null); 
                    }
                }
            });

            return () => unsubscribe();

        } catch (e) {
            console.error("Erro de Inicialização do Firebase:", e);
            setError(`Erro de Inicialização do Firebase: ${e.message}. Verifique suas chaves de configuração.`);
            setAppPhase('login');
        }
    }, []); // Executa apenas uma vez na montagem

    // Busca e carrega prestadores diretamente da planilha Google (aba 'dados')
    useEffect(() => {
        // URL do backend seguro via variável de ambiente Vite
        // Em dev: defina VITE_API_URL=http://localhost:4000
        // Em produção: VITE_API_URL=https://api.seu-dominio.com
        const BACKEND_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

        const fetchSheet = async () => {
            // Busca APENAS pelo backend seguro (service account JSON)
            try {
                const backendEndpoint = `${BACKEND_URL}/api/prestadores`;
                console.log('[DEBUG] Buscando prestadores do backend:', backendEndpoint);
                const backendRes = await fetch(backendEndpoint);
                
                if (!backendRes.ok) {
                    throw new Error(`Backend retornou erro: ${backendRes.status}`);
                }

                const json = await backendRes.json();
                console.log('[DEBUG] Backend retornou:', json);
                
                if (!json || !Array.isArray(json.items)) {
                    throw new Error('Resposta do backend inválida');
                }

                console.log('[DEBUG] Carregado', json.items.length, 'prestadores do backend');
                // Normaliza cnpj e senha para evitar comparações incorretas
                const normalized = json.items.map(i => ({
                    ...i,
                    cnpj: String(i.cnpj || '').replace(/\D/g, ''),
                    senha: String(i.senha || '').trim()
                }));
                setPrestadores(normalized);
                setSheetError(null);
            } catch (e) {
                console.warn('Erro ao carregar planilha (fallback gviz):', e);
                setSheetError(e.message);
                setPrestadores([]);
            }
        };

        fetchSheet();
    }, []);

    // Renderização Principal
    let content;

    if (error) {
        content = (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
                    <AlertMessage message={error} type="error" />
                    <p className="text-gray-500 text-sm mt-4">Corrija o erro e reinicie o servidor (Ctrl+C e npm run dev).</p>
                </div>
            </div>
        );
    } else if (appPhase === 'loading' || !isAuthReady) {
        content = (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="mt-3 text-gray-600">Conectando ao Firebase...</p>
            </div>
        );
    } else if (appPhase === 'login') {
        content = <LoginScreen setUserId={setUserId} setError={setError} setAppPhase={setAppPhase} prestadores={prestadores} />;
    } else if (appPhase === 'dashboard' && userId) {
        // Busca info do prestador logado
        const prestadorInfo = prestadores.find(p => String(p.cnpj || '').replace(/\D/g, '') === String(userId || '').replace(/\D/g, ''));
        content = <DashboardScreen userId={userId} setAppPhase={setAppPhase} setError={setError} db={db} prestadorInfo={prestadorInfo} />;
    } else {
        // Fallback
        content = <LoginScreen setUserId={setUserId} setError={setError} setAppPhase={setAppPhase} prestadores={prestadores} />;
    }

    return (
        <div className="App">
            {content}
        </div>
    );
};

export default App;