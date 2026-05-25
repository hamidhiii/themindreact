import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Lock, User as UserIcon, Check } from 'lucide-react';
import { useLoginMutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import logo from '../../assets/logo.png';

export default function AuthPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [login, { isLoading }] = useLoginMutation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState<'username' | 'password' | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login({ username: username.trim(), password: password.trim() }).unwrap();

            let role = 'admin';
            try {
                const payload = JSON.parse(atob(result.access.split('.')[1]));
                role = payload.role ?? payload.user_role ?? 'admin';
            } catch {
                role = 'admin';
            }

            dispatch(setCredentials({ accessToken: result.access, refreshToken: result.refresh, role }));

            if (role === 'support_teacher') {
                navigate('/support-teacher-home');
            } else if (role === 'teacher') {
                navigate('/teacher-home');
            } else {
                navigate('/the-mind');
            }
        } catch (err: unknown) {
            const e = err as { data?: { detail?: string } };
            setError(e?.data?.detail ?? 'Invalid username or password');
        }
    };

    return (
        <div className="min-h-screen bg-bg-app flex items-center justify-center overflow-hidden font-sans select-none relative">
            {/* Desktop Background */}
            <div className="hidden lg:block absolute inset-0">
                {/* Diagonal Left Section */}
                <div
                    className="absolute left-0 top-0 bottom-0 bg-bg-side shadow-[2px_0_10px_rgba(0,0,0,0.02)]"
                    style={{
                        width: '52%',
                        clipPath: 'polygon(0 0, calc(100% - 60px) 0, 100% 100%, 0 100%)'
                    }}
                >
                    {/* Diagonal Orange Line Border */}
                    <div
                        className="absolute top-0 right-0 bottom-0 w-[1.5px] bg-[#ED6A2E]/30"
                        style={{ height: '100%' }}
                    />

                    {/* Decorative Elements */}
                    <div className="relative h-full w-full">
                        {/* Huge "The Mind." Text */}
                        <div className="absolute left-[32px] bottom-[25%] text-[#1A2233]/[0.06] text-[52px] font-black leading-[0.95] tracking-[-2px] whitespace-pre">
                            The{"\n"}Mind.
                        </div>

                        {/* Logo Top Left */}
                        <div className="absolute left-[25px] top-2">
                            <img src={logo} alt="The Mind" className="h-[150px] w-[150px] object-contain" />
                        </div>

                        {/* Tagline Bottom Left */}
                        <div className="absolute left-10 bottom-12 space-y-2.5">
                            <div className="text-[13px] text-[#1A2233]/40 font-medium leading-[1.5]">
                                Educational Center<br />Management
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-6 h-[3px] bg-primary rounded-sm" />
                                <div className="w-2 h-[3px] bg-primary/40 rounded-sm" />
                            </div>
                        </div>

                        {/* Circles & Dots */}
                        <div className="absolute left-[-60px] top-[10%] w-[320px] h-[320px] rounded-full border border-primary/12" />
                        <div className="absolute left-10 top-[18%] w-[180px] h-[180px] rounded-full border border-primary/18" />
                        <div
                            className="absolute left-20 top-[26%] w-[90px] h-[90px] rounded-full shadow-[0_10px_30px_rgba(237,106,46,0.35)]"
                            style={{ background: 'radial-gradient(circle at center, #ED6A2E 0%, #FF9A6C 100%)', opacity: 0.9 }}
                        />
                        <div className="absolute left-[200px] top-[15%] w-4 h-4 rounded-full bg-primary" />

                        {/* Dot Grid */}
                        <div className="absolute left-40 top-[35%] w-[60px] h-[60px] grid grid-cols-5 gap-y-3">
                            {Array.from({ length: 25 }).map((_, i) => (
                                <div key={i} className="w-[1.8px] h-[1.8px] bg-primary/25 rounded-full" />
                            ))}
                        </div>

                        {/* Skewed Lines */}
                        <div className="absolute left-[30px] top-[55%] w-[140px] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent -rotate-[17deg]" />
                        <div className="absolute left-[60px] top-[58%] w-[80px] h-[1.5px] bg-gradient-to-r from-transparent via-primary/25 to-transparent -rotate-[17deg]" />

                        {/* Shapes */}
                        <div className="absolute left-[60px] bottom-[18%] w-[50px] h-[50px] rounded-lg border-[1.5px] border-primary/30 rotate-[30deg]" />
                        <div className="absolute left-[160px] bottom-[12%] w-7 h-7 rounded bg-primary/15 rotate-[45deg]" />
                    </div>
                </div>
            </div>

            {/* Mobile Header Decoration */}
            <div className="lg:hidden absolute top-0 left-0 right-0 h-[220px] bg-[#E8EBF4] rounded-b-[36px] overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom right, transparent 30%, rgba(237, 106, 46, 0.1) 100%)'
                    }}
                />
                {/* Mobile Circles */}
                <div className="absolute -right-[50px] -top-[50px] w-[200px] h-[200px] rounded-full border border-primary/12" />
                <div className="absolute right-[30px] top-[30px] w-14 h-14 rounded-full shadow-[0_6px_18px_rgba(237,106,46,0.3)]" style={{ background: 'radial-gradient(circle at center, #ED6A2E 0%, #FF9A6C 100%)', opacity: 0.85 }} />
                <div className="absolute left-[30px] bottom-[40px] w-3 h-3 rounded-full bg-primary" />
                <div className="absolute left-[60px] top-[40px] w-[48px] h-[48px] grid grid-cols-4 gap-y-3">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="w-[1.8px] h-[1.8px] bg-primary/25 rounded-full" />
                    ))}
                </div>

                <div className="flex flex-col items-center justify-center h-full pt-2">
                    <img src={logo} alt="Logo" className="h-[70px] w-[200px] object-contain" />
                    <div className="text-[12px] text-[#1A2233]/40 font-medium mt-3">Educational Center Management</div>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative w-full max-w-md lg:max-w-none lg:grid lg:grid-cols-[52%_48%] px-4 z-10">
                {/* Spacer for desktop layout */}
                <div className="hidden lg:block" />

                <div className="flex flex-col lg:pl-[12%] lg:pt-[8%]">
                    {/* "Sign in" Header */}
                    <div className="mb-6 lg:mb-8">
                        <div className="flex items-center gap-2.5 lg:gap-3 mb-1 lg:mb-1.5">
                            <div className="w-[4px] h-[26px] lg:h-[28px] bg-primary rounded-sm" />
                            <h1 className="text-[26px] lg:text-[30px] font-black text-text-primary tracking-tight lg:tracking-tighter">Sign in</h1>
                        </div>
                        <div className="pl-[14px] lg:pl-4 text-[13px] lg:text-[14px] text-gray-400">Access your dashboard</div>
                    </div>

                    {/* Form Card */}
                    <div
                        className="bg-white p-6 lg:p-9 shadow-[0_8px_32px_rgba(26,34,51,0.06),0_4px_20px_rgba(237,106,46,0.04)] lg:shadow-[-8px_16px_48px_-4px_rgba(26,34,51,0.08),0_8px_32px_rgba(237,106,46,0.06)] rounded-tl-[24px] lg:rounded-tl-[28px] rounded-tr-[24px] lg:rounded-tr-[28px] rounded-bl-[6px] lg:rounded-bl-[8px] rounded-br-[24px] lg:rounded-br-[28px] w-full lg:w-[400px]"
                    >
                        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
                            {/* Username */}
                            <div className="space-y-2 lg:space-y-2.5">
                                <label className="text-[13px] font-semibold text-[#1A2233]">Username</label>
                                <div className={`relative transition-all duration-200 rounded-xl ${isFocused === 'username' ? 'shadow-[0_4px_14px_rgba(237,106,46,0.15)]' : 'shadow-[0_2px_6px_rgba(0,0,0,0.04)]'}`}>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <UserIcon size={18} className={isFocused === 'username' ? 'text-primary' : 'text-[#CDCED2]'} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onFocus={() => setIsFocused('username')}
                                        onBlur={() => setIsFocused(null)}
                                        placeholder="Enter your username"
                                        className="w-full bg-[#F8F9FB] border border-gray-100 rounded-xl pl-11 pr-4 py-[14px] lg:py-[15px] text-[14px] font-medium text-text-primary placeholder-[#CDCED2] focus:outline-none focus:border-primary/50 focus:border-[1.5px] transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2 lg:space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[13px] font-semibold text-[#1A2233]">Password</label>
                                    <button type="button" className="text-[12px] text-gray-400 font-medium hover:text-primary transition-colors">Forgot password?</button>
                                </div>
                                <div className={`relative transition-all duration-200 rounded-xl ${isFocused === 'password' ? 'shadow-[0_4px_14px_rgba(237,106,46,0.15)]' : 'shadow-[0_2px_6px_rgba(0,0,0,0.04)]'}`}>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock size={18} className={isFocused === 'password' ? 'text-primary' : 'text-[#CDCED2]'} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setIsFocused('password')}
                                        onBlur={() => setIsFocused(null)}
                                        placeholder="Enter your password"
                                        className="w-full bg-[#F8F9FB] border border-gray-100 rounded-xl pl-11 pr-12 py-[14px] lg:py-[15px] text-[14px] font-medium text-text-primary placeholder-[#CDCED2] focus:outline-none focus:border-primary/50 focus:border-[1.5px] transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#CDCED2] hover:text-gray-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me */}
                            <div
                                className="flex items-center gap-2.5 cursor-pointer group"
                                onClick={() => setRememberMe(!rememberMe)}
                            >
                                <div className={`w-[18px] h-[18px] flex items-center justify-center rounded-[5px] border-[1.5px] transition-all duration-150 ${rememberMe ? 'bg-primary border-primary shadow-[0_2px_6px_rgba(237,106,46,0.3)]' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                    {rememberMe && <Check size={12} className="text-white" />}
                                </div>
                                <span className="text-[13px] text-gray-500 font-medium">Remember me for 30 days</span>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] text-red-500 font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-[52px] bg-primary text-white rounded-tl-[14px] rounded-tr-[14px] rounded-bl-[4px] rounded-br-[14px] text-[15px] font-bold tracking-wide hover:shadow-[0_6px_20px_rgba(237,106,46,0.3)] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 disabled:shadow-none transition-all duration-200 mt-2 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Sign In ->'}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 lg:mt-10 lg:w-[400px] text-center">
                        <p className="text-[11px] text-gray-400 font-medium">
                            (c) 2024 The Mind Educational Center
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
