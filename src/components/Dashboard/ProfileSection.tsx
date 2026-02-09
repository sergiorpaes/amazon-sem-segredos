import React, { useState, useRef } from 'react';
import { Camera, Upload, User, Save, Loader2, Phone, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../services/languageService';

export const ProfileSection: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useLanguage();
    const [isSaving, setIsSaving] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        company_name: user?.company_name || '',
        profile_image: user?.profile_image || '',
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/.netlify/functions/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                await refreshUser();
                alert('Perfil atualizado com sucesso!');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Erro ao atualizar perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    const startCamera = async () => {
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            setIsCameraActive(false);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const imageData = canvasRef.current.toDataURL('image/png');
                setFormData(prev => ({ ...prev, profile_image: imageData }));
                stopCamera();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profile_image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-dark-800 border-2 border-dark-700 flex items-center justify-center relative">
                        {formData.profile_image ? (
                            <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-16 h-16 text-gray-500" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={startCamera} className="p-2 bg-brand-500 rounded-full text-white hover:scale-110 transition-transform">
                                <Camera className="w-4 h-4" />
                            </button>
                            <label className="p-2 bg-white rounded-full text-dark-900 cursor-pointer hover:scale-110 transition-transform">
                                <Upload className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Nome Completo</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500/50 outline-none"
                                />
                                <User className="absolute right-4 top-3.5 w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">E-mail (Não alterável)</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Telefone</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500/50 outline-none"
                                />
                                <Phone className="absolute right-4 top-3.5 w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Empresa</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.company_name}
                                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500/50 outline-none"
                                />
                                <Briefcase className="absolute right-4 top-3.5 w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Salvar Alterações
                    </button>
                </div>
            </div>

            {isCameraActive && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden border-4 border-brand-500/20">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                            <button onClick={takePhoto} className="bg-brand-500 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-brand-500/20 active:scale-95 transition-transform">
                                Capturar Foto
                            </button>
                            <button onClick={stopCamera} className="bg-white text-dark-900 px-8 py-4 rounded-full font-bold active:scale-95 transition-transform">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
