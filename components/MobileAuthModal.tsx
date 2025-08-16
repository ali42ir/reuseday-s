import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

const RESEND_TIMEOUT = 60; // seconds
const MAX_ATTEMPTS = 3;

const MobileAuthModal: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const { loginOrRegisterWithPhone } = useAuth();

    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [phone, setPhone] = useState('');
    const [formattedPhone, setFormattedPhone] = useState('');
    const [code, setCode] = useState('');
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [mockCode, setMockCode] = useState<string | null>(null);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const sendCode = async (phoneNumberToSend: string) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumberToSend, locale: language })
            });

            if (!response.ok) {
                throw new Error('Failed to send code from API');
            }
            
            setMockCode(null); // Ensure we are not in simulation mode
            addToast(t('mobile_auth_code_sent_toast'), 'success');
            setCountdown(RESEND_TIMEOUT);
            setStep('code');
            setAttempts(0);
            setCode('');
        } catch (err) {
            console.error("sendCode API call failed, falling back to simulation:", err);
            
            const fakeCode = Math.floor(1000 + Math.random() * 9000).toString();
            setMockCode(fakeCode); 

            addToast(t('mobile_auth_sms_failed_simulation', { code: fakeCode }), 'error');
            
            setCountdown(RESEND_TIMEOUT);
            setStep('code');
            setAttempts(0);
            setCode('');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        let normalized = phone
            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
            .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
            .replace(/[\s-()]/g, '');

        if (normalized.startsWith('00')) {
            normalized = '+' + normalized.substring(2);
        } else if (normalized.startsWith('0')) {
            normalized = '+32' + normalized.substring(1); // Assume Belgium
        }
        
        const e164Regex = /^\+[1-9]\d{8,14}$/;
        if (!e164Regex.test(normalized)) {
            const errorMsg = t('mobile_auth_invalid_format');
            setError(errorMsg);
            addToast(errorMsg, 'error');
            return;
        }

        setFormattedPhone(normalized);
        await sendCode(normalized);
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // --- SIMULATION PATH ---
        if (mockCode) {
            if (code === mockCode) {
                const loginSuccess = await loginOrRegisterWithPhone(formattedPhone);
                if (loginSuccess) onSuccess(); else setError(t('login_error'));
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    setError(t('mobile_auth_too_many_attempts'));
                } else {
                    setError(t('mobile_auth_invalid_code'));
                }
            }
            setIsLoading(false);
            return;
        }

        // --- REAL API PATH ---
        try {
            const response = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone, code })
            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    setError(t('mobile_auth_too_many_attempts'));
                } else {
                    setError(t('mobile_auth_invalid_code'));
                }
                return;
            }

            const loginSuccess = await loginOrRegisterWithPhone(formattedPhone);
            if (loginSuccess) {
                onSuccess();
            } else {
                setError(t('login_error'));
            }
        } catch (err) {
            console.error("verifyCode error:", err);
            setError(t('login_error'));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                 <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t('mobile_auth_title')}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl" aria-label={t('close')}>&times;</button>
                </div>

                {step === 'phone' && (
                    <form onSubmit={handlePhoneSubmit}>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">{t('mobile_auth_phone_prompt')}</p>
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            <div>
                                <label htmlFor="auth-phone" className="sr-only">{t('mobile_auth_enter_phone')}</label>
                                <input id="auth-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+324..." className="block w-full p-2 border-gray-300 rounded-md" required autoFocus />
                                <p className="text-xs text-gray-500 mt-1">{t('mobile_auth_format_helper')}</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input id="policy" type="checkbox" checked={policyAccepted} onChange={e => setPolicyAccepted(e.target.checked)} className="h-4 w-4 text-amazon-yellow border-gray-300 rounded" />
                                </div>
                                <div className="ms-3 text-sm">
                                    <label htmlFor="policy" className="font-light text-gray-700">
                                        {t('mobile_auth_agreement')}
                                    </label>
                                </div>
                            </div>
                        </div>
                         <div className="p-4 bg-gray-50 flex justify-end">
                            <button type="submit" disabled={!policyAccepted || !phone || isLoading} className="w-full bg-amazon-yellow text-amazon-blue font-bold py-2 px-4 rounded-lg disabled:bg-gray-300">
                                {isLoading ? t('ai_generating') : t('mobile_auth_continue_button')}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'code' && (
                     <form onSubmit={handleCodeSubmit}>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">{t('mobile_auth_code_prompt')}</p>
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            <div>
                                <label htmlFor="auth-code" className="sr-only">Code</label>
                                <input
                                    id="auth-code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="block w-full p-2 border-gray-300 rounded-md text-center tracking-[0.5em]"
                                    maxLength={4}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="text-center text-sm">
                                {countdown > 0 ? (
                                    <span className="text-gray-500">{t('mobile_auth_resend_timer', { seconds: countdown })}</span>
                                ) : (
                                    <button type="button" onClick={() => sendCode(formattedPhone)} disabled={isLoading} className="text-blue-600 hover:underline disabled:text-gray-400">
                                        {t('mobile_auth_resend_code')}
                                    </button>
                                )}
                            </div>
                        </div>
                         <div className="p-4 bg-gray-50 flex justify-end">
                            <button type="submit" disabled={isLoading} className="w-full bg-amazon-yellow text-amazon-blue font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                                {isLoading ? t('ai_generating') : t('mobile_auth_verify_button')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default MobileAuthModal;