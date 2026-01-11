import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/admin');
        } catch (err) {
            console.error("Login failed", err);
            setError('ログインに失敗しました: ' + err.message);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-8 text-er-primary">管理者ログイン</h1>
            <div className="card w-full max-w-md bg-er-card p-8 rounded-lg shadow-lg">
                <p className="mb-8 text-gray-300">管理画面にアクセスするにはログインが必要です。</p>

                {error && (
                    <div className="p-4 bg-red-500 text-white rounded mb-4">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-black font-bold py-3 px-6 rounded flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                    <span className="text-blue-500 font-bold text-xl">G</span>
                    Googleでログイン
                </button>
            </div>
        </div>
    );
}
