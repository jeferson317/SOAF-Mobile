import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, where, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { LogIn, Truck, CreditCard, DollarSign, Loader2, Zap, AlertTriangle, ArrowLeft, XCircle, RefreshCw, Key, Lock } from 'lucide-react';

// --- CONFIGURAÇÃO E AUTENTICAÇÃO FIREBASE ---

// Variáveis globais fornecidas pelo ambiente (Obrigatórias)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'soaf-mobile-app';

// 1. Configuração do Firebase.
// >>> CONFIGURAÇÃO ATUALIZADA PARA SOAF MOBILE <<<
const LOCAL_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCacyiH60KE5LlE9LopzEmdumTxtJwnu54",
    authDomain: "soaf-mobile.firebaseapp.com",
    projectId: "soaf-mobile",
    storageBucket: "soaf-mobile.firebasestorage.app",
    messagingSenderId: "728183223510",
    appId: "1:728183223510:web:ce00fd2b62e6def9c68577",
    measurementId: "G-RPRJ3VNT18"
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
const LoginScreen = ({ setUserId, setError, setAppPhase, prestadores = [], setPrimeiroAcesso, setPorTentativasFalhas }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [logoError, setLogoError] = useState(false);
    
    // Carrega tentativas do localStorage
    const getTentativas = (cnpj) => {
        try {
            const stored = localStorage.getItem('tentativas_login');
            if (!stored) return 0;
            const data = JSON.parse(stored);
            return data[cnpj] || 0;
        } catch {
            return 0;
        }
    };
    
    const setTentativas = (cnpj, count) => {
        try {
            const stored = localStorage.getItem('tentativas_login');
            const data = stored ? JSON.parse(stored) : {};
            if (count === 0) {
                delete data[cnpj];
            } else {
                data[cnpj] = count;
            }
            localStorage.setItem('tentativas_login', JSON.stringify(data));
        } catch (err) {
            console.error('Erro ao salvar tentativas:', err);
        }
    };

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
                // Reseta contador de tentativas erradas
                setTentativas(cnpjNormalized, 0);
                console.log('[DEBUG] Senha correta, contador resetado para CNPJ:', cnpjNormalized);

                // Registra o login no backend
                fetch('https://soaf-mobile-backend.onrender.com/api/log-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cnpj: cnpjNormalized,
                        nome: found.nome || found['login sistema'] || 'Desconhecido',
                        timestamp: new Date().toISOString()
                    })
                }).catch(err => console.warn('Erro ao registrar login:', err));
                
                setUserId(cnpjNormalized);
                setError(null);
                
                // Verifica se é primeiro acesso
                const primeiroAcessoFlag = String(found.primeiro_acesso || found['primeiro acesso'] || '').trim().toUpperCase();
                console.log('[DEBUG] Primeiro acesso flag:', primeiroAcessoFlag);
                if (primeiroAcessoFlag === 'SIM' || primeiroAcessoFlag === 'S' || primeiroAcessoFlag === '1') {
                    console.log('[DEBUG] Redirecionando para troca de senha (primeiro acesso)');
                    setPrimeiroAcesso(true);
                    setPorTentativasFalhas(false);
                    setAppPhase('change-password');
                } else {
                    console.log('[DEBUG] Acesso normal ao dashboard');
                    setPrimeiroAcesso(false);
                    setPorTentativasFalhas(false);
                    setAppPhase('dashboard');
                }
            } else {
                // Incrementa contador de tentativas erradas
                const tentativasAnteriores = getTentativas(cnpjNormalized);
                const tentativasAtuais = tentativasAnteriores + 1;
                console.log('[DEBUG] Senha incorreta. Tentativas anteriores:', tentativasAnteriores, '→ Tentativas atuais:', tentativasAtuais, 'para CNPJ:', cnpjNormalized);
                
                // Se atingiu 3 tentativas, força troca de senha
                if (tentativasAtuais >= 3) {
                    console.log('[SECURITY] ⚠️ 3 TENTATIVAS FALHAS ATINGIDAS para CNPJ:', cnpjNormalized);
                    console.log('[SECURITY] Redirecionando para troca de senha obrigatória');
                    setTentativas(cnpjNormalized, 0); // Reseta contador
                    setUserId(cnpjNormalized);
                    setPrimeiroAcesso(false); // Não é primeiro acesso, é por tentativas
                    setPorTentativasFalhas(true);
                    setError(null);
                    setAppPhase('change-password');
                } else {
                    // Salva contador no localStorage
                    setTentativas(cnpjNormalized, tentativasAtuais);
                    
                    const tentativasRestantes = 3 - tentativasAtuais;
                    console.log('[DEBUG] Tentativas restantes:', tentativasRestantes);
                    setError(`Senha incorreta. ${tentativasRestantes} tentativa${tentativasRestantes > 1 ? 's' : ''} restante${tentativasRestantes > 1 ? 's' : ''}.`);
                }
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
                            src="/soaf-logo.png"
                            alt="SOAF Mobile"
                            className="w-64 h-auto mx-auto mb-6 object-contain"
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
            <p className="mt-6 text-xs text-gray-500">Desenvolvido para SOAF Mobile - ID do App: {appId}</p>
        </div>
    );
};

// 2. Tela de Troca de Senha (Primeiro Acesso ou Tentativas Falhas)
const ChangePasswordScreen = ({ userId, setAppPhase, setError, prestadores, setPrimeiroAcesso, porTentativasFalhas = false }) => {
    const [cpf, setCpf] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [logoError, setLogoError] = useState(false);

    const BACKEND_URL = import.meta.env?.VITE_API_URL || 'https://soaf-mobile-backend.onrender.com';

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLocalError('');
        
        // Validações
        if (novaSenha.length < 4) {
            setLocalError('A senha deve ter no mínimo 4 caracteres');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setLocalError('As senhas não coincidem');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Valida CPF
            console.log('[DEBUG] Validando CPF...');
            const validaCpfRes = await fetch(`${BACKEND_URL}/api/validar-cpf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cnpj: userId, cpf })
            });

            const validaCpfData = await validaCpfRes.json();
            
            if (!validaCpfRes.ok || !validaCpfData.ok) {
                setLocalError(validaCpfData.error || 'Erro ao validar CPF');
                setIsLoading(false);
                return;
            }

            if (!validaCpfData.valid) {
                setLocalError('CPF não corresponde ao cadastrado no sistema');
                setIsLoading(false);
                return;
            }

            // 2. Atualiza senha
            console.log('[DEBUG] CPF válido, atualizando senha...');
            const atualizaSenhaRes = await fetch(`${BACKEND_URL}/api/atualizar-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cnpj: userId, cpf, novaSenha })
            });

            const atualizaSenhaData = await atualizaSenhaRes.json();

            if (!atualizaSenhaRes.ok || !atualizaSenhaData.ok) {
                setLocalError(atualizaSenhaData.error || 'Erro ao atualizar senha');
                setIsLoading(false);
                return;
            }

            // Sucesso!
            console.log('[DEBUG] Senha atualizada com sucesso');
            setPrimeiroAcesso(false);
            setError(null);
            setAppPhase('dashboard');

        } catch (err) {
            console.error('[ERROR] Erro ao trocar senha:', err);
            setLocalError('Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('soaf_session');
        console.log('[SESSION] Sessão removida - Logout manual');
        setPrimeiroAcesso(false);
        setAppPhase('login');
        setError(null);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
                <div className="text-center mb-6">
                    {logoError ? (
                        <Key className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    ) : (
                        <img
                            src="/soaf-logo.png"
                            alt="SOAF Mobile"
                            className="w-64 h-auto mx-auto mb-4 object-contain"
                            onError={() => setLogoError(true)}
                        />
                    )}
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {porTentativasFalhas ? 'Redefinição de Senha' : 'Primeiro Acesso'}
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {porTentativasFalhas 
                            ? 'Por segurança, você precisa redefinir sua senha após 3 tentativas incorretas'
                            : 'Para sua segurança, você precisa alterar sua senha'
                        }
                    </p>
                </div>

                <div className={`${porTentativasFalhas ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-3 mb-6`}>
                    <div className="flex items-start">
                        <AlertTriangle className={`w-5 h-5 ${porTentativasFalhas ? 'text-red-600' : 'text-yellow-600'} mr-2 flex-shrink-0 mt-0.5`} />
                        <div className={`text-sm ${porTentativasFalhas ? 'text-red-800' : 'text-yellow-800'}`}>
                            <p className="font-semibold mb-1">
                                {porTentativasFalhas ? 'Segurança da Conta' : 'Validação de Identidade'}
                            </p>
                            <p>
                                {porTentativasFalhas 
                                    ? 'Você digitou a senha incorreta 3 vezes. Digite seu CPF cadastrado para confirmar sua identidade e criar uma nova senha.'
                                    : 'Digite seu CPF cadastrado para confirmar sua identidade antes de alterar a senha.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {localError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-600">{localError}</p>
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPF (apenas números)
                        </label>
                        <input
                            type="tel"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                            placeholder="00000000000"
                            maxLength={11}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Mínimo 4 caracteres"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Nova Senha
                        </label>
                        <input
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            placeholder="Digite a senha novamente"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex-1 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Voltar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
                        </button>
                    </div>
                </form>
            </div>
            <p className="mt-6 text-xs text-gray-500">Desenvolvido para SOAF Mobile</p>
        </div>
    );
};

// 3. Tela de Dashboard (Página principal após login)
const DashboardScreen = ({ userId, setAppPhase, setError, db, prestadorInfo }) => {
    const [tasks, setTasks] = useState([]);
    const [reportTasks, setReportTasks] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [closing, setClosing] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [firestoreError, setFirestoreError] = useState(null);
    const [creatingSample, setCreatingSample] = useState(false);
    const [activeTab, setActiveTab] = useState('rota'); // 'rota', 'relatorio', 'descontos' ou 'fechamento'
    const [logoErrorDash, setLogoErrorDash] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    
    // Filtros de período para abas "executados" e "fechamento"
    const [filterExecutadosDataDe, setFilterExecutadosDataDe] = useState('');
    const [filterExecutadosDataAte, setFilterExecutadosDataAte] = useState('');
    const [filterFechamentoDataDe, setFilterFechamentoDataDe] = useState('');
    const [filterFechamentoDataAte, setFilterFechamentoDataAte] = useState('');

    // URL do backend via variável de ambiente
    const BACKEND_URL = import.meta.env?.VITE_API_URL || 'https://soaf-mobile-backend.onrender.com';

    // Função para converter data DD/MM/YYYY para Date
    const parseDataBR = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const [day, month, year] = dateStr.trim().split('/');
        if (!day || !month || !year) return null;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };

    // Função para validar se data é válida
    const isValidDate = (date) => date instanceof Date && !isNaN(date);

    // Função para converter valor brasileiro (R$ 1.500,00) para número
    const parseValorBR = (valor) => {
        if (!valor) return 0;
        // Remove R$, espaços, e converte , para . (1.500,00 -> 1500.00)
        const valorStr = String(valor).replace(/R\$\s*/g, '').trim();
        // Remove pontos de milhar e substitui vírgula decimal por ponto
        const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.');
        return parseFloat(valorLimpo) || 0;
    };

    // Função para filtrar relatório (executados) por período
    // Aceita parâmetros opcionais para permitir uso por outras abas (ex: Fechamento)
    const getFilteredReportTasks = (customDataDe = null, customDataAte = null) => {
        const dataDeStr = customDataDe || filterExecutadosDataDe;
        const dataAteStr = customDataAte || filterExecutadosDataAte;
        
        console.log('[FILTRO EXECUTADOS] dataDeStr:', dataDeStr);
        console.log('[FILTRO EXECUTADOS] dataAteStr:', dataAteStr);
        
        if (!dataDeStr && !dataAteStr) {
            console.log('[FILTRO EXECUTADOS] Sem filtro, retornando todos:', reportTasks.length);
            return reportTasks;
        }

        const dataDe = dataDeStr ? parseDataBR(dataDeStr) : null;
        const dataAte = dataAteStr ? parseDataBR(dataAteStr) : null;
        
        console.log('[FILTRO EXECUTADOS] Data De convertida:', dataDe);
        console.log('[FILTRO EXECUTADOS] Data Até convertida:', dataAte);

        const filtered = reportTasks.filter(task => {
            const taskDate = parseDataBR(task.dateClose);
            console.log('[FILTRO EXECUTADOS] Task:', task.sa, 'Data:', task.dateClose, 'Convertida:', taskDate);
            
            if (!isValidDate(taskDate)) {
                console.log('[FILTRO EXECUTADOS] Data inválida, incluindo task');
                return true;
            }

            if (dataDe && taskDate < dataDe) {
                console.log('[FILTRO EXECUTADOS] Task antes da data inicial, excluindo');
                return false;
            }
            if (dataAte && taskDate > dataAte) {
                console.log('[FILTRO EXECUTADOS] Task depois da data final, excluindo');
                return false;
            }
            console.log('[FILTRO EXECUTADOS] Task incluída no filtro');
            return true;
        });
        
        console.log('[FILTRO EXECUTADOS] Total filtrado:', filtered.length);
        return filtered;
    };

    // Função para filtrar fechamento por período
    // Como a aba fechamento não tem data, vamos calcular baseado nos serviços executados
    const getFilteredClosing = () => {
        console.log('[FILTRO FECHAMENTO] filterFechamentoDataDe:', filterFechamentoDataDe);
        console.log('[FILTRO FECHAMENTO] filterFechamentoDataAte:', filterFechamentoDataAte);
        
        // Se não há filtro, retorna o fechamento original
        if (!filterFechamentoDataDe && !filterFechamentoDataAte) {
            console.log('[FILTRO FECHAMENTO] Sem filtro, retornando dados originais:', closing.length);
            return closing;
        }

        console.log('[FILTRO FECHAMENTO] Aplicando filtro baseado em serviços executados');
        
        // Se há filtro, calcula o fechamento baseado nos serviços executados no período
        // Passa as datas do fechamento como parâmetros
        const servicosFiltrados = getFilteredReportTasks(filterFechamentoDataDe, filterFechamentoDataAte);
        
        console.log('[FILTRO FECHAMENTO] Serviços filtrados:', servicosFiltrados.length);
        
        // Se não há serviços executados filtrados, retorna array vazio
        if (servicosFiltrados.length === 0) {
            console.log('[FILTRO FECHAMENTO] Nenhum serviço no período, retornando vazio');
            return [];
        }

        // Calcula totais dos serviços executados no período
        const totalServicosExecutados = servicosFiltrados.reduce((sum, task) => {
            return sum + parseValorBR(task.value);
        }, 0);
        
        console.log('[FILTRO FECHAMENTO] Total serviços executados:', totalServicosExecutados);

        // Busca descontos do período (se houver filtro de data nos descontos também)
        const descontosFiltrados = discounts.filter(desconto => {
            if (!filterFechamentoDataDe && !filterFechamentoDataAte) return true;
            
            const descontoDate = parseDataBR(desconto.data);
            if (!isValidDate(descontoDate)) return true;

            const dataDe = filterFechamentoDataDe ? parseDataBR(filterFechamentoDataDe) : null;
            const dataAte = filterFechamentoDataAte ? parseDataBR(filterFechamentoDataAte) : null;

            if (dataDe && descontoDate < dataDe) return false;
            if (dataAte && descontoDate > dataAte) return false;
            return true;
        });

        const totalDescontos = descontosFiltrados.reduce((sum, desconto) => {
            return sum + parseValorBR(desconto.valor);
        }, 0);
        
        console.log('[FILTRO FECHAMENTO] Total descontos:', totalDescontos);

        const totalAReceber = totalServicosExecutados - totalDescontos;
        
        console.log('[FILTRO FECHAMENTO] Total a receber:', totalAReceber);

        // Retorna um único item de fechamento calculado do período
        return [{
            id: 'periodo-filtrado',
            cnpjPrestador: userId,
            valorServicos: totalServicosExecutados.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            descontos: totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            valorReceber: totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }];
    };

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
            setIsLoading(false);
            setFirestoreError(null);
        } catch (e) {
            console.error('[ERROR] Erro ao carregar tarefas:', e);
            setFirestoreError(`Erro ao carregar ordens: ${e.message}`);
            setTasks([]);
            setIsLoading(false);
        }
    };

    // Função consolidada para atualizar todos os dados
    const fetchAllData = async () => {
        console.log('[DEBUG] fetchAllData iniciado');
        setLastUpdate(new Date());
        await Promise.all([
            fetchTasksFromSheet(),
            fetchReportFromSheet(),
            fetchDiscountsFromSheet(),
            fetchClosingFromSheet()
        ]);
    };

    // Atualização manual via botão
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchAllData();
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        // Carrega dados inicialmente
        fetchAllData();

        // Auto-refresh a cada 5 minutos (300000ms)
        const intervalId = setInterval(() => {
            console.log('[DEBUG] Auto-refresh executado (5 minutos)');
            fetchAllData();
        }, 300000);

        // Limpa o intervalo quando o componente for desmontado
        return () => clearInterval(intervalId);
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

    const handleLogout = () => {
        localStorage.removeItem('soaf_session');
        console.log('[SESSION] Sessão removida - Logout manual');
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
            {/* Header com botões de atualização e sair */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-xs text-gray-500">
                    Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150 bg-white px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                        {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition duration-150 bg-white px-4 py-2 rounded-lg shadow"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Sair
                    </button>
                </div>
            </div>

            {/* Card de informações do prestador */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <div className="flex items-center mb-4">
                    {logoErrorDash ? (
                        <Truck className="w-10 h-10 text-blue-600 mr-3" />
                    ) : (
                        <img
                            src="/soaf-logo.png"
                            alt="SOAF Mobile"
                            className="h-14 w-auto mr-3 object-contain"
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                </div>
            </div>

            {firestoreError && <AlertMessage message={firestoreError} type="error" />}

            <div className="bg-white p-6 rounded-xl shadow-lg">
                {/* Aba: Rota do Dia */}
                {activeTab === 'rota' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Minhas Ordens de Serviço ({tasks.length})</h2>

                {tasks.length === 0 && (
                    <p className="text-gray-500">Nenhuma ordem de serviço encontrada. Contate o administrador do sistema.</p>
                )}
                
                {tasks.length > 0 && (
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
                        
                        {/* Filtro de Período */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-bold text-gray-800 mb-3">🔍 Filtrar por Período</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">De (DD/MM/YYYY)</label>
                                    <input
                                        type="text"
                                        placeholder="01/12/2025"
                                        value={filterExecutadosDataDe}
                                        onChange={(e) => setFilterExecutadosDataDe(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Até (DD/MM/YYYY)</label>
                                    <input
                                        type="text"
                                        placeholder="10/12/2025"
                                        value={filterExecutadosDataAte}
                                        onChange={(e) => setFilterExecutadosDataAte(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {(filterExecutadosDataDe || filterExecutadosDataAte) && (
                                    <button
                                        onClick={() => {
                                            setFilterExecutadosDataDe('');
                                            setFilterExecutadosDataAte('');
                                        }}
                                        className="col-span-1 sm:col-span-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-lg transition duration-150"
                                    >
                                        ✕ Limpar Filtro
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {reportTasks.length === 0 ? (
                            <p className="text-gray-500">Nenhum serviço executado encontrado.</p>
                        ) : (
                            <>
                            {/* Resumo por tipo de serviço - DINÂMICO COM FILTRO */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Resumo por Tipo de Serviço {filterExecutadosDataDe || filterExecutadosDataAte ? '(Filtrado)' : ''}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {Object.entries(
                                        getFilteredReportTasks().reduce((acc, task) => {
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
                                {(filterExecutadosDataDe || filterExecutadosDataAte) && (
                                    <p className="text-xs text-gray-600 mt-3">
                                        Total exibido: <span className="font-bold text-green-700">{getFilteredReportTasks().length}</span> de {reportTasks.length} serviços
                                    </p>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {getFilteredReportTasks().map(task => (
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
                        
                        {/* Filtro de Período */}
                        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h3 className="text-sm font-bold text-gray-800 mb-3">🔍 Filtrar por Período</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">De (DD/MM/YYYY)</label>
                                    <input
                                        type="text"
                                        placeholder="01/12/2025"
                                        value={filterFechamentoDataDe}
                                        onChange={(e) => setFilterFechamentoDataDe(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Até (DD/MM/YYYY)</label>
                                    <input
                                        type="text"
                                        placeholder="10/12/2025"
                                        value={filterFechamentoDataAte}
                                        onChange={(e) => setFilterFechamentoDataAte(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                {(filterFechamentoDataDe || filterFechamentoDataAte) && (
                                    <button
                                        onClick={() => {
                                            setFilterFechamentoDataDe('');
                                            setFilterFechamentoDataAte('');
                                        }}
                                        className="col-span-1 sm:col-span-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-lg transition duration-150"
                                    >
                                        ✕ Limpar Filtro
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {closing.length === 0 ? (
                            <p className="text-gray-500">Nenhum fechamento encontrado.</p>
                        ) : (
                            <>
                            {/* Resumo consolidado - DINÂMICO COM FILTRO */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                                <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Resumo Consolidado {filterFechamentoDataDe || filterFechamentoDataAte ? '(Filtrado)' : ''}</h3>
                                {(() => {
                                    const filteredData = getFilteredClosing();
                                    const totalServicos = filteredData.reduce((sum, item) => {
                                        return sum + parseValorBR(item.valorServicos);
                                    }, 0);
                                    const totalDescontos = filteredData.reduce((sum, item) => {
                                        return sum + parseValorBR(item.descontos);
                                    }, 0);
                                    const totalReceber = filteredData.reduce((sum, item) => {
                                        return sum + parseValorBR(item.valorReceber);
                                    }, 0);

                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <p className="text-xs text-blue-700 font-semibold uppercase">Total de Serviços</p>
                                                <p className="text-3xl font-extrabold text-blue-600 mt-1">R$ {totalServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="text-xs text-gray-600 mt-2">{getFilteredClosing().length} registro(s)</p>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                                <p className="text-xs text-red-700 font-semibold uppercase">Total de Descontos</p>
                                                <p className="text-3xl font-extrabold text-red-600 mt-1">R$ {totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="text-xs text-gray-600 mt-2">{totalServicos > 0 ? ((totalDescontos / totalServicos) * 100).toFixed(1) : '0.0'}% do total</p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <p className="text-xs text-green-700 font-semibold uppercase">Total a Receber</p>
                                                <p className="text-3xl font-extrabold text-green-600 mt-1">R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                <p className="text-xs text-gray-600 mt-2">Líquido do período</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            
                            <div className="space-y-4">
                                {getFilteredClosing().map(close => (
                                    <div key={close.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-purple-50 transition duration-150">
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div className="bg-blue-50 p-3 rounded">
                                                <p className="font-bold text-blue-700">Valor Serviços</p>
                                                <p className="text-lg font-extrabold text-blue-600">{close.valorServicos}</p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded">
                                                <p className="font-bold text-red-700">Descontos</p>
                                                <p className="text-lg font-extrabold text-red-600">{close.descontos}</p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded">
                                                <p className="font-bold text-green-700">Total a Receber</p>
                                                <p className="text-lg font-extrabold text-green-600">{close.valorReceber}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


// 3. Componente Principal do Aplicativo
const App = () => {
    // Carrega sessão salva do localStorage
    const getSavedSession = () => {
        try {
            const saved = localStorage.getItem('soaf_session');
            if (saved) {
                const session = JSON.parse(saved);
                console.log('[SESSION] Sessão encontrada no localStorage:', session.userId);
                return session;
            }
        } catch (err) {
            console.error('[SESSION] Erro ao carregar sessão:', err);
        }
        return null;
    };

    const savedSession = getSavedSession();
    
    // Estado de Fases: 'loading', 'login', 'change-password', 'dashboard'
    const [appPhase, setAppPhase] = useState(savedSession ? 'dashboard' : 'loading'); 
    const [userId, setUserId] = useState(savedSession?.userId || null);
    const [error, setError] = useState(null);
    const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
    const [porTentativasFalhas, setPorTentativasFalhas] = useState(false);
    
    // Instâncias do Firebase
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [prestadores, setPrestadores] = useState([]);
    const [sheetError, setSheetError] = useState(null);

    // Salva sessão no localStorage sempre que userId mudar
    useEffect(() => {
        if (userId && appPhase === 'dashboard') {
            const session = {
                userId,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('soaf_session', JSON.stringify(session));
            console.log('[SESSION] Sessão salva no localStorage');
        }
    }, [userId, appPhase]);

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
        content = <LoginScreen setUserId={setUserId} setError={setError} setAppPhase={setAppPhase} prestadores={prestadores} setPrimeiroAcesso={setPrimeiroAcesso} setPorTentativasFalhas={setPorTentativasFalhas} />;
    } else if (appPhase === 'change-password' && userId) {
        content = <ChangePasswordScreen userId={userId} setAppPhase={setAppPhase} setError={setError} prestadores={prestadores} setPrimeiroAcesso={setPrimeiroAcesso} porTentativasFalhas={porTentativasFalhas} />;
    } else if (appPhase === 'dashboard' && userId) {
        // Busca info do prestador logado
        const prestadorInfo = prestadores.find(p => String(p.cnpj || '').replace(/\D/g, '') === String(userId || '').replace(/\D/g, ''));
        content = <DashboardScreen userId={userId} setAppPhase={setAppPhase} setError={setError} db={db} prestadorInfo={prestadorInfo} />;
    } else {
        // Fallback
        content = <LoginScreen setUserId={setUserId} setError={setError} setAppPhase={setAppPhase} prestadores={prestadores} setPrimeiroAcesso={setPrimeiroAcesso} setPorTentativasFalhas={setPorTentativasFalhas} />;
    }

    return (
        <div className="App">
            {content}
        </div>
    );
};

export default App;