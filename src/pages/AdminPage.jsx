import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export function AdminPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        imageUrl: '',
        nameJp: '',
        nameKr: ''
    });
    const [previewSrc, setPreviewSrc] = useState('');
    const [status, setStatus] = useState('');
    const [questions, setQuestions] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Fetch questions on mount
    const fetchQuestions = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "skins"));
            const qList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setQuestions(qList);
        } catch (error) {
            console.error("Error fetching skins:", error);
            setStatus('データの取得に失敗しました');
        }
    };

    useEffect(() => {
        // Simple auth check
        if (!auth.currentUser) {
            // In a real app, listen to onAuthStateChanged. 
            // Here we assume if loaded via direct link without login, 
            // we might want to redirect. But for now relying on user flow.
            // navigate('/login'); 
        }
        fetchQuestions();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    // Helper to convert Drive link to direct link
    const convertDriveLink = (link) => {
        if (!link) return '';

        let id = null;

        // Pattern 1: /file/d/ID/view
        const fileDMatch = link.match(/\/file\/d\/([-\w]+)/);
        if (fileDMatch && fileDMatch[1]) {
            id = fileDMatch[1];
        }
        // Pattern 2: id=ID
        else {
            const idParamMatch = link.match(/[?&]id=([-\w]+)/);
            if (idParamMatch && idParamMatch[1]) {
                id = idParamMatch[1];
            }
        }

        if (id) {
            // uc?export=view is sometimes blocked. 
            // thumbnail?id=ID&sz=w1000 is more reliable for embedding.
            return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
        }

        // Fallback: If it's a direct image link (ends in jpg/png etc) or just unknown, return as is
        return link;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        let finalValue = value;
        if (name === 'imageUrl') {
            finalValue = convertDriveLink(value);
            setPreviewSrc(finalValue);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleEdit = (skin) => {
        setFormData({
            imageUrl: skin.imageUrl,
            nameJp: skin.nameJp,
            nameKr: skin.nameKr
        });
        setPreviewSrc(skin.imageUrl);
        setEditingId(skin.id);
        setStatus(`編集モード: ${skin.nameJp}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormData({ imageUrl: '', nameJp: '', nameKr: '' });
        setPreviewSrc('');
        setEditingId(null);
        setStatus('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('本当に削除しますか？')) return;
        try {
            await deleteDoc(doc(db, "skins", id));
            setStatus('削除しました');
            fetchQuestions();
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error("Error deleting:", error);
            setStatus('削除エラー');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setStatus('保存中...');
            if (editingId) {
                await updateDoc(doc(db, "skins", editingId), {
                    ...formData,
                    updatedAt: new Date()
                });
                setStatus('更新しました！');
                setEditingId(null);
            } else {
                await addDoc(collection(db, "skins"), {
                    ...formData,
                    createdAt: new Date()
                });
                setStatus('追加しました！');
            }
            fetchQuestions();
            setFormData({ imageUrl: '', nameJp: '', nameKr: '' });
            setPreviewSrc('');
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error("Error saving document: ", error);
            setStatus('保存エラー: ' + error.message);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-er-primary">管理パネル</h1>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition">ゲームへ</button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 transition">ログアウト</button>
                </div>
            </div>

            <div className="card bg-er-card p-6 rounded-lg mb-8 text-left">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block mb-2 text-gray-400">画像URL (Google Drive / Direct Link)</label>
                        <input
                            type="text"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="https://..."
                            required
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-er-primary outline-none"
                        />
                        {previewSrc && (
                            <div className="mt-4 rounded overflow-hidden bg-black">
                                <img
                                    src={previewSrc}
                                    alt="Preview"
                                    referrerPolicy="no-referrer"
                                    className="max-h-64 mx-auto object-contain"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-gray-400">スキン名 (日本語)</label>
                            <input
                                type="text"
                                name="nameJp"
                                value={formData.nameJp}
                                onChange={handleChange}
                                placeholder="例: ジャッキー"
                                required
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-er-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-gray-400">スキン名 (韓国語)</label>
                            <input
                                type="text"
                                name="nameKr"
                                value={formData.nameKr}
                                onChange={handleChange}
                                placeholder="例: 재키"
                                required
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:border-er-primary outline-none"
                            />
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded font-bold ${status.includes('エラー') ? 'bg-red-500 text-white' : 'bg-green-500 text-black'}`}>
                            {status}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button type="submit" className="flex-1 bg-er-primary text-black font-bold py-3 rounded hover:bg-yellow-400 transition">
                            {editingId ? '更新する' : '追加する'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} className="bg-gray-600 text-white px-6 rounded hover:bg-gray-500 transition">
                                キャンセル
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="w-full">
                <h2 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">登録済み一覧 ({questions.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {questions.map(q => (
                        <div key={q.id} className="bg-er-card border border-gray-800 p-4 rounded-lg flex flex-col gap-2">
                            <div className="h-32 bg-black rounded overflow-hidden mb-2 flex items-center justify-center">
                                <img src={q.imageUrl} alt={q.nameJp} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="font-bold text-er-primary">{q.nameJp}</div>
                            <div className="text-sm text-gray-400">{q.nameKr}</div>
                            <div className="flex gap-2 mt-auto pt-2">
                                <button
                                    onClick={() => handleEdit(q)}
                                    className="flex-1 bg-blue-600 py-1 rounded text-sm hover:bg-blue-500 transition"
                                >
                                    編集
                                </button>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="flex-1 bg-red-600 py-1 rounded text-sm hover:bg-red-500 transition"
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
