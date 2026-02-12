import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../services/languageService';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (base64Image: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Não foi possível acessar a câmera. Verifique as permissões.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64Image = canvas.toDataURL('image/jpeg');
                onCapture(base64Image);
                onClose();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-900">
                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                            <Camera size={20} />
                        </div>
                        <h3 className="text-xl font-bold">Capturar Foto</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="text-white text-center p-8">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="text-red-500" size={32} />
                            </div>
                            <p className="font-medium">{error}</p>
                            <button
                                onClick={startCamera}
                                className="mt-4 px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <RefreshCw size={18} />
                                Tentar Novamente
                            </button>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Overlay guides */}
                            <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/50 rounded-2xl relative">
                                    <div className="absolute top-1/2 left-0 w-full border-t border-white/20" />
                                    <div className="absolute top-0 left-1/2 h-full border-l border-white/20" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-8 flex justify-center">
                    {!error && (
                        <button
                            onClick={handleCapture}
                            className="w-20 h-20 bg-brand-600 border-8 border-brand-100 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-white group-hover:scale-90 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
