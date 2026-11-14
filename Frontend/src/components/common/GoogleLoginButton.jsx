import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';

function GoogleLoginButton({ onSuccess, isLoading, text = 'Đăng nhập với Google' }) {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const buttonRef = useRef(null);
    const onSuccessRef = useRef(onSuccess);
    const [gsiReady, setGsiReady] = useState(Boolean(window.google?.accounts?.id));
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [manualToken, setManualToken] = useState('');

    useEffect(() => {
        onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    useEffect(() => {
        if (!googleClientId) return;

        const initGoogleButton = () => {
            if (!window.google?.accounts?.id || !buttonRef.current) return;
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: (response) => {
                    if (response?.credential) {
                        onSuccessRef.current?.(response.credential);
                    } else {
                        toast.error('Không nhận được Google ID Token.');
                    }
                }
            });
            buttonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(buttonRef.current, {
                theme: 'outline',
                size: 'large',
                shape: 'pill',
                width: 360,
                text: 'continue_with',
                locale: 'vi'
            });
            setGsiReady(true);
        };

        if (window.google?.accounts?.id) {
            initGoogleButton();
            return;
        }

        let script = document.querySelector(`script[src="${GOOGLE_GSI_SRC}"]`);
        if (!script) {
            script = document.createElement('script');
            script.src = GOOGLE_GSI_SRC;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        script.addEventListener('load', initGoogleButton);
        return () => script.removeEventListener('load', initGoogleButton);
    }, [googleClientId]);

    const handleManualSubmit = () => {
        const trimmed = manualToken.trim();
        if (!trimmed) {
            toast.error('Vui lòng dán Google ID Token hợp lệ.');
            return;
        }
        onSuccess?.(trimmed);
    };

    return (
        <div className="mt-6">
            <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-3 text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">
                    Hoặc
                </span>
                <div className="border-t border-gray-200 w-full"></div>
            </div>

            {googleClientId ? (
                <div className={`flex flex-col items-center ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div ref={buttonRef} className="w-full flex justify-center min-h-[44px]" />
                    {!gsiReady && (
                        <p className="text-xs text-gray-400 mt-2 animate-pulse">Đang tải Google Sign-In...</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => setShowTokenInput((prev) => !prev)}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-textmain font-semibold text-sm shadow-sm transition-all disabled:opacity-60"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                            <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                        </svg>
                        <span>{text}</span>
                    </button>

                    {showTokenInput && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                            <p className="text-gray-500">
                                Chưa cấu hình <code className="text-olive font-semibold">VITE_GOOGLE_CLIENT_ID</code> trong <code className="text-olive">.env</code>. Bạn có thể dán Google ID Token để kiểm thử API:
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualToken}
                                    onChange={(e) => setManualToken(e.target.value)}
                                    placeholder="Dán Google ID Token..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-earth"
                                />
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={handleManualSubmit}
                                    className="px-3 py-2 rounded-lg bg-olive text-white font-bold hover:bg-earth transition-colors shrink-0"
                                >
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default GoogleLoginButton;
