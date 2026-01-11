import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { MosaicCanvas } from '../components/MosaicCanvas';
import { PredictionSearch } from '../components/PredictionSearch';
import { useNavigate } from 'react-router-dom';

export function GamePage() {
    const navigate = useNavigate();

    // Global Data
    const [allSkins, setAllSkins] = useState([]);
    const [loading, setLoading] = useState(true);

    // Game Config & State
    const [gameState, setGameState] = useState('START'); // START, PLAYING, RESULT
    const [language, setLanguage] = useState('JP'); // JP, KR

    const [gameConfigs, setGameConfigs] = useState([]); // 10 selected skins
    const [currentRound, setCurrentRound] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [results, setResults] = useState([]); // { skin, timeTaken, isCorrect } (Though logic says we only pass if correct eventually?)

    // Feedback
    const [feedback, setFeedback] = useState(null); // 'CORRECT', 'WRONG'

    // Load Data
    useEffect(() => {
        const loadSkins = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'skins'));
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setAllSkins(list);
            } catch (err) {
                console.error(err);
                alert("データの読み込みに失敗しました");
            } finally {
                setLoading(false);
            }
        };
        loadSkins();
    }, []);

    // Timer Logic
    useEffect(() => {
        if (gameState !== 'PLAYING') return;
        if (feedback === 'CORRECT') return; // Stop timer/mosaic when answered correctly

        if (timeLeft <= 0) {
            // Time up logic? Treat as fail or just force reveal?
            // "正解なら…→残り秒数がスコアになる". If 0, score 0.
            // Requirement doesn't explicitly say what happens on timeout independently of answer.
            // Usually game over for that round or force skip?
            // Let's assume force skip with 0 score and max time taken (30s).
            handleRoundEnd(false);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 0.1)); // 100ms updates for smooth slide
        }, 100);

        return () => clearInterval(timer);
    }, [gameState, timeLeft, feedback]);

    // Round Result (Answer Reveal) Logic - Enter key support
    useEffect(() => {
        if (gameState !== 'ROUND_RESULT') return;
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') nextRound();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    const startGame = (lang) => {
        setLanguage(lang);
        // Pick 10 random
        const shuffled = [...allSkins].sort(() => 0.5 - Math.random());
        setGameConfigs(shuffled.slice(0, 10));

        setCurrentRound(0);
        setScore(0);
        setResults([]);
        startRound();
        setGameState('PLAYING');
    };

    const startRound = () => {
        setTimeLeft(30);
        setFeedback(null);
    };

    const handleSelect = (skin) => {
        if (feedback === 'CORRECT') return; // Prevent double submit

        const currentSkin = gameConfigs[currentRound];
        if (skin.id === currentSkin.id) {
            // CORRECT
            const roundScore = Math.ceil(timeLeft);
            setScore(prev => prev + roundScore);
            setFeedback('CORRECT');

            // Record Result
            const timeTaken = 30 - timeLeft;
            setResults(prev => [...prev, { skin: currentSkin, timeTaken, result: 'WIN' }]);

            // Wait a moment then show Answer Reveal
            setTimeout(() => {
                setGameState('ROUND_RESULT');
            }, 1000);
        } else {
            // WRONG
            setTimeLeft(prev => Math.max(0, prev - 5));
            setFeedback('WRONG');
            setTimeout(() => setFeedback(null), 500); // Clear flash
        }
    };

    const handleRoundEnd = (isTimeout) => {
        // Called when time runs out without correct answer
        // Show Reveal even if timeout? Or just skip? 
        // User asked for reveal after "NICE!", implying win state.
        // For timeout, let's also show reveal for consistency so they know what it was.
        const currentSkin = gameConfigs[currentRound];
        setResults(prev => [...prev, { skin: currentSkin, timeTaken: 30, result: 'LOSE' }]);
        setGameState('ROUND_RESULT');
    };

    const nextRound = () => {
        if (currentRound + 1 >= gameConfigs.length || currentRound + 1 >= 10) {
            setGameState('RESULT');
        } else {
            setCurrentRound(prev => prev + 1);
            startRound();
            setGameState('PLAYING');
        }
    };

    // Render Helpers
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (gameState === 'START') {
        return (
            <div className="container mx-auto min-h-screen flex flex-col items-center justify-center gap-8">
                <h1 className="text-6xl font-black text-er-primary drop-shadow-lg">SKIN GUESS</h1>
                <p className="text-xl text-gray-400">Eternal Return スキン当てクイズ</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => startGame('JP')}
                        className="px-8 py-4 bg-white text-black font-bold text-xl rounded hover:scale-105 transition transform"
                    >
                        日本語でスタート
                    </button>
                    <button
                        onClick={() => startGame('KR')}
                        className="px-8 py-4 bg-blue-500 text-white font-bold text-xl rounded hover:scale-105 transition transform"
                    >
                        한국어로 시작
                    </button>
                </div>
                <div className="mt-8 text-sm text-gray-500">
                    全 {allSkins.length} 問搭載 / 1プレイ 10問
                </div>
                <a href="/admin" className="text-gray-600 underline text-sm">管理画面へ</a>
            </div>
        );
    }

    // ROUND_RESULT Screen (Answer Reveal)
    if (gameState === 'ROUND_RESULT') {
        const currentResult = results[results.length - 1];
        const skin = currentResult.skin;

        return (
            <div className="container mx-auto min-h-screen flex flex-col items-center justify-center gap-6 animate-fade-in">
                <div className="text-3xl font-bold text-gray-400">ANSWER</div>

                <div className="card bg-er-card p-4 rounded-xl border border-gray-700 shadow-2xl">
                    <img
                        src={skin.imageUrl}
                        alt="Answer"
                        referrerPolicy="no-referrer"
                        className="max-h-[50vh] object-contain rounded"
                    />
                </div>

                <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                        {language === 'KR' ? skin.nameKr : skin.nameJp}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                    <div className="bg-black/50 p-4 rounded text-center">
                        <div className="text-gray-400 text-sm">Time</div>
                        <div className="text-2xl font-mono text-er-primary">
                            {currentResult.timeTaken.toFixed(2)}s
                        </div>
                    </div>
                    <div className="bg-black/50 p-4 rounded text-center">
                        <div className="text-gray-400 text-sm">Score Earned</div>
                        <div className="text-2xl font-mono text-er-primary">
                            +{Math.ceil(currentResult.result === 'WIN' ? (30 - currentResult.timeTaken) : 0)}
                        </div>
                    </div>
                </div>

                <button
                    onClick={nextRound}
                    className="mt-8 px-8 py-4 bg-er-primary text-black font-bold text-xl rounded flex items-center gap-2 hover:brightness-110 transition"
                >
                    NEXT
                    <span className="text-xs bg-black text-white px-2 py-1 rounded ml-2">↵ Enter</span>
                </button>
            </div>
        );
    }

    if (gameState === 'RESULT') {
        // Find MVP logic
        // Best Time (lowest timeTaken) among WIN results
        const wins = results.filter(r => r.result === 'WIN');
        const bestRecord = wins.length > 0 ? wins.reduce((prev, curr) => curr.timeTaken < prev.timeTaken ? curr : prev) : null;

        return (
            <div className="container mx-auto py-8">
                <h2 className="text-4xl font-bold mb-8 text-center">RESULTS</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Score Card */}
                    <div className="card bg-er-card p-8 flex flex-col items-center justify-center">
                        <div className="text-gray-400 mb-2">Total Score</div>
                        <div className="text-6xl font-black text-er-primary">{score}</div>
                    </div>

                    {/* MVP Card */}
                    <div className="card bg-er-card p-8 flex flex-col items-center justify-center border-2 border-er-primary relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-er-primary text-black font-bold px-3 py-1 text-sm">Fastest</div>
                        {bestRecord ? (
                            <>
                                <div className="text-6xl mb-4">👑</div>
                                <img
                                    src={bestRecord.skin.imageUrl}
                                    alt="MVP"
                                    className="h-32 object-contain mb-4 rounded"
                                />
                                <div className="text-2xl font-bold mb-1">
                                    {language === 'KR' ? bestRecord.skin.nameKr : bestRecord.skin.nameJp}
                                </div>
                                <div className="text-er-primary font-mono text-xl">
                                    {bestRecord.timeTaken.toFixed(2)}s
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-500">No correct answers...</div>
                        )}
                    </div>
                </div>

                {/* Detail List */}
                <div className="bg-er-card rounded-lg overflow-hidden mb-8">
                    <table className="w-full text-left">
                        <thead className="bg-black text-gray-400">
                            <tr>
                                <th className="p-4">#</th>
                                <th className="p-4">Skin</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} className="border-t border-gray-800">
                                    <td className="p-4">{i + 1}</td>
                                    <td className="p-4 text-lg">
                                        {language === 'KR' ? r.skin.nameKr : r.skin.nameJp}
                                    </td>
                                    <td className="p-4 font-mono">
                                        {r.timeTaken.toFixed(2)}s
                                    </td>
                                    <td className="p-4">
                                        {r.result === 'WIN'
                                            ? <span className="text-green-500 font-bold">CLEAR</span>
                                            : <span className="text-red-500 font-bold">MISS</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setGameState('START')}
                        className="px-6 py-3 bg-white text-black font-bold rounded"
                    >
                        タイトルに戻る
                    </button>
                    {/* Twitter Share link could go here */}
                </div>
            </div>
        );
    }

    // PLAYING State
    const currentSkin = gameConfigs[currentRound];

    // Custom progress logic:
    // 0-5s (Elapsed): Stay at 0 (heaviest mosaic)
    // 5-30s (Elapsed): Cubic ease from 0 to 1
    const elapsed = 30 - timeLeft;
    let progress = 0;


    // Normalize remaining 25s to 0..1
    if (elapsed > 5) {
        // Normalize remaining 25s to 0..1
        const p = (elapsed - 5) / 25;

        // Custom Curve: Cubic with base offset
        const baseOffset = 0.025; // スタート時点ですでに少しだけ明けている状態にする
        const curveStrength = 0.1; // 最終的な上限

        // スタート値 + (残り幅 * 3乗カーブ)
        progress = Math.min(curveStrength, baseOffset + Math.pow(p, 2) * (curveStrength - baseOffset));
    }


    return (
        <div className="container mx-auto flex flex-col items-center py-4 min-h-screen">
            {/* HUD */}
            <div className="w-full max-w-4xl flex justify-between items-end mb-4 px-4">
                <div className="text-xl font-bold">Round {currentRound + 1} / 10</div>
                <div className="font-mono text-5xl font-bold text-er-primary">
                    {Math.ceil(timeLeft)}
                </div>
                <div className="text-xl font-bold">Score: {score}</div>
            </div>

            {/* Game Area */}
            <div className="relative w-full max-w-2xl mb-8">
                <MosaicCanvas
                    imageUrl={currentSkin.imageUrl}
                    progress={progress}
                    width={800}
                    height={500}
                />

                {/* Feedback Overlay */}
                {feedback && (
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 ${feedback === 'CORRECT' ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                        <div className={`text-6xl font-black text-white drop-shadow-md transform scale-150 transition-all`}>
                            {feedback === 'CORRECT' ? 'NICE!' : '-5 SEC!'}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="w-full max-w-lg z-10">
                <PredictionSearch
                    skins={allSkins}
                    language={language}
                    onSelect={handleSelect}
                />
            </div>
        </div>
    );
}
