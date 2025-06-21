import { useEffect, useState } from 'preact/hooks';

// Define types
interface SrtEntry {
    index: string;
    start: string;
    end: string;
    text: string;
}

function parseSRT(srtText: string): SrtEntry[] {
    const entries: SrtEntry[] = [];
    const blocks = srtText.split(/\n\s*\n/);
    for (const block of blocks) {
        const lines = block.trim().split(/\r?\n/);
        if (lines.length >= 3) {
            const index = lines[0];
            const [start, end] = lines[1].split(' --> ');
            const text = lines.slice(2).join(' ');
            entries.push({ index, start, end, text });
        }
    }
    return entries;
}

function App() {
    const [srtEntries, setSrtEntries] = useState<SrtEntry[]>([]);
    const [promptData, setPromptData] = useState<any>(null);
    const [translations, setTranslations] = useState<{ [key: number]: string }>({});
    const [merged, setMerged] = useState<{ [key: number]: boolean }>({});
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

    useEffect(() => {
        fetch('/test.srt')
            .then(res => res.ok ? res.text() : null)
            .then(text => {
                if (text) {
                    setSrtEntries(parseSRT(text));
                }
            });
    }, []);

    useEffect(() => {
        fetch('/prompt.json')
            .then((res) => res.json())
            .then(setPromptData)
            .catch(console.error);
    }, []);

    function getContextEntries(index: number) {
        const context = srtEntries.slice(Math.max(0, index - 10), index)
            .concat(srtEntries.slice(index + 1, index + 11));
        return context.map(e => e.text);
    }

    async function handleLineClick(i: number) {
        if (!promptData) return;
        let apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            apiKey = window.prompt('Enter your OpenAI API key:') || '';
            if (apiKey) localStorage.setItem('openai_api_key', apiKey);
            else return;
        }
        setLoadingIndex(i);
        const entry = srtEntries[i];
        const nextEntry = srtEntries[i + 1] || null;
        const context = getContextEntries(i);
        const promptString = promptData.prompt.replace(/<language>/gi, promptData.language);
        const gptInput = {
            prompt: promptString,
            targetlanguage: promptData.language,
            summary: promptData.summary,
            srtEntry: entry.text,
            nextSrtEntry: nextEntry ? nextEntry.text : null,
            context: context
        };
        const systemMessage =
            'You are a translation assistant. Respond ONLY with a JSON object in this format: {"translation": string, "mergedWithNextEntry": bool}.';
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: JSON.stringify(gptInput) }
                    ],
                    temperature: 0.2
                })
            });
            const data = await res.json();
            let content = data.choices?.[0]?.message?.content || '';
            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch {
                // Try to extract JSON from text
                const match = content.match(/\{[\s\S]*\}/);
                parsed = match ? JSON.parse(match[0]) : { translation: 'Error: Invalid response', mergedWithNextEntry: false };
            }
            setTranslations(t => ({ ...t, [i]: parsed.translation }));
            if (parsed.mergedWithNextEntry) {
                setMerged(m => ({ ...m, [i + 1]: true }));
            }
        } catch (e) {
            setTranslations(t => ({ ...t, [i]: 'Translation error' }));
        } finally {
            setLoadingIndex(null);
        }
    }

    // Format message for a single SRT entry
    function prepareMessageForEntry(entry: SrtEntry) {
        // You can customize this if you want to include a prompt
        return `${entry.index}\n${entry.start} --> ${entry.end}\n${entry.text}`;
    }

    return (
        <div class="p-4 max-w-4xl mx-auto">
            <div class="mb-4">
                <h2 class="font-semibold">SRT Table:</h2>
                <div class="overflow-auto max-h-96 border rounded">
                    <table class="min-w-full text-xs">
                        <thead class="bg-gray-100 sticky top-0">
                            <tr>
                                <th class="px-2 py-1 border-b text-left">#</th>
                                <th class="px-2 py-1 border-b text-left">Timestamps</th>
                                <th class="px-2 py-1 border-b text-left">Content</th>
                                <th class="px-2 py-1 border-b text-left">Translated Content</th>
                            </tr>
                        </thead>
                        <tbody>
                            {srtEntries.map((e, i) => (
                                <tr key={i} class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleLineClick(i)}
                                >
                                    <td class="px-2 py-1 border-b align-top">{e.index}</td>
                                    <td class="px-2 py-1 border-b align-top whitespace-nowrap">{e.start} <br />→ {e.end}</td>
                                    <td class="px-2 py-1 border-b align-top">{e.text}</td>
                                    <td class="px-2 py-1 border-b align-top text-blue-700 italic">
                                        {loadingIndex === i ? 'Translating...' :
                                            merged[i] ? <span class="text-gray-400">(merged with previous)</span> :
                                                translations[i] || ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default App;
