import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, ChevronRight, PackagePlus } from 'lucide-react';
import { User } from '../../types';
import { INITIAL_USERS } from '../../data/mockData';
import { generateId } from '../../utils/helpers';

interface LoginViewProps {
    onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [mockUsers] = useState<User[]>(INITIAL_USERS);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';

        if (!email.toLowerCase().endsWith('@envos.es')) {
            alert('Solo se permiten correos corporativos @envos.es');
            return;
        }

        try {
            const endpoint = isRegistering ? '/api/register' : '/api/login';
            const bodyStyle = isRegistering
                ? { email, nombre: name, password, rol: 'operario' }
                : { email, password };

            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyStyle)
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data);
            } else {
                alert(data.message || 'Error en el sistema');
            }
        } catch (error) {
            alert('No se pudo conectar con el servidor de autenticación');
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#632f9a] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0c9eea] rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                <div className="text-center mb-10">
                    <div className="mb-6 flex justify-center">
                        <img src="/logo-3.png" alt="Envos Logo" className="h-24 w-auto object-contain" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">GESTIÓN DE USO DE MATERIALES</p>
                </div>

                <div className="glass-card rounded-[2rem] p-10 border border-white/10 shadow-3xl">
                    <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">
                        {isRegistering ? 'Crear Cuenta' : 'Acceso al Sistema'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isRegistering && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#632f9a] transition-colors">
                                        <UserIcon size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#632f9a]/20 focus:border-[#632f9a] transition-all"
                                        placeholder="Ej: Juan Pérez"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#632f9a] transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#632f9a]/20 focus:border-[#632f9a] transition-all"
                                    placeholder="usuario@envos.es"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#632f9a] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#632f9a]/20 focus:border-[#632f9a] transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-3 py-4 envos-gradient text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#632f9a]/20 hover:shadow-[#632f9a]/40 transition-all active:scale-[0.98]"
                        >
                            {isRegistering ? 'Registrar' : 'Entrar al Sistema'}
                            <ChevronRight size={18} />
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col gap-3">
                        {isRegistering ? (
                            <button
                                onClick={() => setIsRegistering(false)}
                                className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#632f9a] transition-colors"
                            >
                                ¿Ya tienes cuenta? Iniciar Sesión
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsRegistering(true)}
                                    className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#632f9a] transition-colors"
                                >
                                    Crear Cuenta Nueva
                                </button>
                                <a
                                    href="mailto:it@envos.es"
                                    className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#632f9a] transition-colors"
                                >
                                    ¿Olvidaste tu contraseña? Contacta con IT
                                </a>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    ENVOS · SVQ · PLATFORM
                </div>
            </div>
        </div>
    );
};
