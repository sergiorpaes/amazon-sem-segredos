
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ExternalLink, Save, X, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SupplierCategory } from '../../data/suppliers';

interface Supplier {
    id: number;
    name: string;
    url: string;
    categories: SupplierCategory[];
    description: string;
    country?: string;
    featured?: boolean;
}

export const Suppliers: React.FC = () => {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        url: '',
        categories: [],
        description: '',
        country: 'ES',
        featured: false
    });

    const categories: SupplierCategory[] = [
        'Geral', 'Casa & Cozinha', 'Brinquedos & Geek', 'Eletrônicos',
        'Beleza & Saúde', 'Moda & Infantil', 'Festas',
        'Ferramentas & Bricolagem', 'Bebê', 'Decoração'
    ];

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/suppliers');
            const data = await response.json();
            if (Array.isArray(data)) {
                setSuppliers(data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.url) {
            alert('Nome e URL são obrigatórios');
            return;
        }

        try {
            const method = editingSupplier ? 'PUT' : 'POST';
            const body = editingSupplier ? { ...formData, id: editingSupplier.id } : formData;

            // Get token from local storage or context (assuming AuthContext might not expose raw token directly, usage implies token handling)
            // For now, let's assume the auth context handles headers or we retrieve from wherever it's stored
            // In a real app, you'd probably use an axiom interceptor or similar. 
            // Here we will try to get it from localStorage if available, or just send the request
            // NOTE: The backend checks for Authorization header.
            const token = localStorage.getItem('token'); // Adjust key as per your auth implementation

            const response = await fetch('/.netlify/functions/suppliers', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                await fetchSuppliers();
                setIsModalOpen(false);
                setEditingSupplier(null);
                setFormData({
                    name: '', url: '', categories: [], description: '', country: 'ES', featured: false
                });
            } else {
                const err = await response.json();
                alert(`Erro ao salvar: ${err.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
            alert('Erro de conexão');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/.netlify/functions/suppliers?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await fetchSuppliers();
            } else {
                alert('Erro ao excluir');
            }
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const openModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({ ...supplier });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '', url: '', categories: [], description: '', country: 'ES', featured: false
            });
        }
        setIsModalOpen(true);
    };

    const toggleCategory = (cat: SupplierCategory) => {
        const currentCats = formData.categories || [];
        if (currentCats.includes(cat)) {
            setFormData({ ...formData, categories: currentCats.filter(c => c !== cat) });
        } else {
            setFormData({ ...formData, categories: [...currentCats, cat] });
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gerenciar Fornecedores</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Novo Fornecedor
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <input
                    type="text"
                    placeholder="Buscar fornecedores..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Categorias</th>
                            <th className="p-4">País</th>
                            <th className="p-4 text-center">Destaque</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum fornecedor encontrado.</td></tr>
                        ) : (
                            filteredSuppliers.map(supplier => (
                                <tr key={supplier.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{supplier.name}</div>
                                        <a href={supplier.url} target="_blank" rel="noopener" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                            {supplier.url} <ExternalLink size={10} />
                                        </a>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {supplier.categories.map((c, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{supplier.country}</td>
                                    <td className="p-4 text-center">
                                        {supplier.featured ? (
                                            <span className="inline-block p-1 bg-yellow-100 text-yellow-600 rounded-full"><Check size={14} /></span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openModal(supplier)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(supplier.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Site *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${formData.categories?.includes(cat)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        checked={formData.featured}
                                        onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Destacar Fornecedor (Top List)</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <Save size={18} />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
