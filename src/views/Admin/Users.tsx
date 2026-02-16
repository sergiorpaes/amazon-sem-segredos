
import React, { useState, useEffect } from 'react';
import {
    Search, MoreVertical, Shield, Ban, CreditCard,
    Loader2, User as UserIcon, Mail, Calendar,
    Filter, ChevronRight, X, UserPlus, Key, LogOut,
    AlertCircle
} from 'lucide-react';

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    subscription_status?: string;
    plan_name?: string;
    credits_balance?: number;
    banned_at?: string | null;
}

interface ActionModalState {
    type: 'CREDITS' | 'PLAN' | 'PASSWORD' | 'BAN' | null;
    user: User | null;
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [modal, setModal] = useState<ActionModalState>({ type: null, user: null });
    const [submitting, setSubmitting] = useState(false);

    // Modal input states
    const [creditAmount, setCreditAmount] = useState(0);
    const [newPlanId, setNewPlanId] = useState(1);
    const [newPassword, setNewPassword] = useState('');

    const itemsPerPage = 20;

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, currentPage, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const offset = (currentPage - 1) * itemsPerPage;

            let url = `/.netlify/functions/get-admin-users?limit=${itemsPerPage}&offset=${offset}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
            if (statusFilter) url += `&status=${statusFilter}`;

            const response = await fetch(url);

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data.users);
            setTotalCount(data.totalCount);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!modal.user || !modal.type) return;

        try {
            setSubmitting(true);

            let payload: any = {};
            if (modal.type === 'CREDITS') payload = { amount: creditAmount, description: 'Ajuste manual administrativo' };
            if (modal.type === 'PLAN') payload = { planId: newPlanId };
            if (modal.type === 'PASSWORD') payload = { newPassword };
            if (modal.type === 'BAN') payload = { banned: !modal.user.banned_at };

            const res = await fetch('/.netlify/functions/admin-user-action', {
                method: 'POST',
                body: JSON.stringify({
                    userId: modal.user.id,
                    action: modal.type === 'CREDITS' ? 'UPDATE_CREDITS' :
                        modal.type === 'PLAN' ? 'CHANGE_PLAN' :
                            modal.type === 'PASSWORD' ? 'RESET_PASSWORD' : 'SET_BANNED_STATUS',
                    payload
                })
            });

            if (!res.ok) throw new Error('Falha ao processar ação');

            setModal({ type: null, user: null });
            fetchUsers(); // Refresh
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-dark-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Gerenciamento de Usuários
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Visualize e controle as contas registradas na plataforma.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none w-full md:w-80 text-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        <option value="">Todos Status</option>
                        <option value="active">Ativos</option>
                        <option value="trialing">Trial</option>
                        <option value="delinquent">Inadimplentes</option>
                        <option value="canceled">Cancelados</option>
                    </select>
                </div>
            </div>

            {loading && users.length === 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-dark-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-800 dark:text-red-400 font-bold">{error}</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-dark-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plano</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Créditos</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Cadastro</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <p className="text-gray-400">Nenhum usuário encontrado.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-900/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.banned_at ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
                                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            {user.full_name || 'Usuário Sem Nome'}
                                                            {user.role === 'ADMIN' && <Shield className="w-3 h-3 text-purple-500" />}
                                                            {user.banned_at && <Ban className="w-3 h-3 text-red-500" title="Banido" />}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <Mail size={10} /> {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block w-fit mb-1 ${user.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                                                        user.subscription_status === 'canceled' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {user.plan_name || 'Free'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 lowercase">{user.subscription_status || 'no subscription'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`font-mono text-sm font-bold ${Number(user.credits_balance) <= 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {user.role === 'ADMIN' ? '∞' : (user.credits_balance ?? 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                    <Calendar size={12} /> {formatDate(user.created_at)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setModal({ type: 'CREDITS', user })}
                                                        className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                        title="Editar Créditos"
                                                    >
                                                        <CreditCard size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setModal({ type: 'PLAN', user })}
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Mudar Plano"
                                                    >
                                                        <UserPlus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setModal({ type: 'PASSWORD', user })}
                                                        className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                        title="Resetar Senha"
                                                    >
                                                        <Key size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setModal({ type: 'BAN', user })}
                                                        className={`p-2 rounded-lg transition-colors ${user.banned_at ? 'text-green-500 hover:bg-green-50' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                                                        title={user.banned_at ? "Desbanir" : "Banir Usuário"}
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalCount > itemsPerPage && !loading && (
                <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
                    <span className="text-xs text-gray-500">Mostrando {users.length} de {totalCount} usuários</span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-dark-700 disabled:opacity-30"
                        >
                            Anterior
                        </button>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-900 dark:bg-white text-white dark:text-dark-900 disabled:opacity-30"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            )}

            {/* Action Modals */}
            {modal.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 translate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-dark-700 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {modal.type === 'CREDITS' ? 'Ajustar Créditos' :
                                    modal.type === 'PLAN' ? 'Mudar Plano' :
                                        modal.type === 'PASSWORD' ? 'Resetar Senha' : 'Banir Conta'}
                            </h3>
                            <button onClick={() => setModal({ type: null, user: null })} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 dark:bg-dark-900 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                                    {modal.user?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{modal.user?.full_name}</p>
                                    <p className="text-sm text-gray-500">{modal.user?.email}</p>
                                </div>
                            </div>

                            {modal.type === 'CREDITS' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Quantidade de Créditos (±)</label>
                                    <input
                                        type="number"
                                        onChange={(e) => setCreditAmount(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Ex: 50 para adicionar, -10 para remover"
                                    />
                                </div>
                            )}

                            {modal.type === 'PLAN' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Novo Plano de Assinatura</label>
                                    <select
                                        onChange={(e) => setNewPlanId(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="1">Starter</option>
                                        <option value="2">Pro</option>
                                        <option value="3">Premium</option>
                                        <option value="4">Free</option>
                                    </select>
                                </div>
                            )}

                            {modal.type === 'PASSWORD' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Nova Senha Temporária</label>
                                    <input
                                        type="text"
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                                        placeholder="Digite a nova senha..."
                                    />
                                </div>
                            )}

                            {modal.type === 'BAN' && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {modal.user?.banned_at
                                        ? 'Tem certeza que deseja desbanir este usuário? Ele voltará a ter acesso total à plataforma.'
                                        : 'Tem certeza que deseja banir este usuário? Ele perderá acesso imediato e a conta será marcada como inativa.'}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setModal({ type: null, user: null })}
                                className="flex-1 px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={submitting}
                                className={`flex-1 px-6 py-3 font-bold text-white rounded-xl flex items-center justify-center gap-2 ${modal.type === 'BAN' && !modal.user?.banned_at ? 'bg-red-600' : 'bg-gray-900'
                                    }`}
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

