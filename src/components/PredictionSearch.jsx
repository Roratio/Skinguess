import React, { useState, useEffect, useRef } from 'react';

export function PredictionSearch({ skins, onSelect, language }) {
    const [query, setQuery] = useState('');
    const [filteredParams, setFilteredParams] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!query) {
            setFilteredParams([]);
            return;
        }

        const lowerQ = query.toLowerCase();
        const matches = skins.filter(s => {
            // Target name based on language
            const targetName = language === 'KR' ? s.nameKr : s.nameJp;
            // Also check the other language just in case, or just consistent logic?
            // "検索画面に文字を打ち込むと、文字列が一致している予測一覧に、スキンの名前が出てきます"
            // Usually matching the target language is primary.
            // Let's match both fields just to be friendly, but display target.

            return (s.nameJp && s.nameJp.toLowerCase().includes(lowerQ)) ||
                (s.nameKr && s.nameKr.toLowerCase().includes(lowerQ));
        });
        setFilteredParams(matches.slice(0, 8)); // Limit to 8
        setSelectedIndex(0);
    }, [query, skins, language]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Tab') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredParams.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredParams.length) % filteredParams.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredParams.length > 0) {
                confirmSelection(filteredParams[selectedIndex]);
            }
        }
    };

    const confirmSelection = (skin) => {
        onSelect(skin);
        setQuery('');
        setFilteredParams([]);
        // Keep focus? Usually yes.
    };

    return (
        <div className="relative w-full max-w-lg mx-auto">
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'KR' ? "스킨 이름을 입력하세요..." : "スキン名を入力..."}
                className="w-full p-4 text-lg bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-er-primary outline-none shadow-xl"
                autoFocus
            />

            {filteredParams.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-gray-800 border border-gray-700 rounded-b-lg shadow-2xl overflow-hidden z-10 mt-1">
                    {filteredParams.map((s, idx) => (
                        <li
                            key={s.id}
                            className={`p-3 cursor-pointer flex justify-between items-center ${idx === selectedIndex ? 'bg-er-primary text-black font-bold' : 'text-gray-300 hover:bg-gray-700'}`}
                            onClick={() => confirmSelection(s)}
                        >
                            <span>{language === 'KR' ? s.nameKr : s.nameJp}</span>
                            <span className="text-xs opacity-70">
                                {language === 'KR' ? s.nameJp : s.nameKr}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
