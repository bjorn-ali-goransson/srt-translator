import { useEffect, useState } from 'preact/hooks';

// Define types
interface SrtEntry {
    index: string;
    start: string;
    end: string;
    text: string;
}

interface PromptJson {
    prompt: string;
    summary: string;
    language: string;
    [key: string]: any;
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
    const [promptJson, setPromptJson] = useState<PromptJson | { error: string } | null>(null);
    const [srtFileName, setSrtFileName] = useState('');
    const [promptFileName, setPromptFileName] = useState('');

    // Load sample files from public folder on mount
    useEffect(() => {
        // Load prompt.json
        fetch('/prompt.json')
            .then(res => res.ok ? res.text() : null)
            .then(text => {
                if (text) {
                    try {
                        setPromptJson(JSON.parse(text));
                        setPromptFileName('prompt.json');
                    } catch {
                        setPromptJson({ error: 'Invalid JSON in prompt.json' });
                    }
                }
            });
        // Load test.srt
        fetch('/test.srt')
            .then(res => res.ok ? res.text() : null)
            .then(text => {
                if (text) {
                    setSrtEntries(parseSRT(text));
                    setSrtFileName('test.srt');
                }
            });
    }, []);

    const handleSrtUpload = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        setSrtFileName(file?.name || '');
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result;
                if (typeof result === 'string') {
                    setSrtEntries(parseSRT(result));
                }
            };
            reader.readAsText(file);
        }
    };

    const handlePromptUpload = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        setPromptFileName(file?.name || '');
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result;
                if (typeof result === 'string') {
                    try {
                        setPromptJson(JSON.parse(result));
                    } catch {
                        setPromptJson({ error: 'Invalid JSON' });
                    }
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div class="p-4 max-w-2xl mx-auto">
            <h1 class="text-2xl font-bold mb-4">SRT Translator</h1>
            <div class="mb-4">
                <label class="block mb-1 font-semibold">Upload SRT file:</label>
                <input type="file" accept=".srt" onChange={handleSrtUpload} class="mb-2" />
                {srtFileName && <div class="text-xs text-gray-500">{srtFileName}</div>}
            </div>
            <div class="mb-4">
                <label class="block mb-1 font-semibold">Upload prompt.json:</label>
                <input type="file" accept=".json" onChange={handlePromptUpload} class="mb-2" />
                {promptFileName && <div class="text-xs text-gray-500">{promptFileName}</div>}
            </div>
            <div class="mb-4">
                <h2 class="font-semibold">SRT Preview ({srtEntries.length} entries):</h2>
                <ul class="text-xs max-h-40 overflow-auto bg-gray-50 p-2 rounded">
                    {srtEntries.slice(0, 5).map((e, i) => (
                        <li key={i}><b>{e.index}</b>: {e.text}</li>
                    ))}
                    {srtEntries.length > 5 && <li>...</li>}
                </ul>
            </div>
            <div class="mb-4">
                <h2 class="font-semibold">Prompt JSON Preview:</h2>
                <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">{promptJson ? JSON.stringify(promptJson, null, 2) : 'No prompt loaded.'}</pre>
            </div>
        </div>
    );
}

export default App;
