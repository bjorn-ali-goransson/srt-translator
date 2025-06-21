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
    const [testMode, setTestMode] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const [editMessage, setEditMessage] = useState<string | null>(null);

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

    // Helper to get prompt with <language> replaced
    function getPromptWithLanguage() {
        if (promptJson && typeof promptJson === 'object' && 'prompt' in promptJson && 'language' in promptJson) {
            return promptJson.prompt.replace(/<language>/gi, promptJson.language);
        }
        return '';
    }

    // Simulate preparing the message to send to ChatGPT
    function prepareMessage() {
        // For demo, just use the prompt with language and first 3 SRT entries
        const srtSample = srtEntries.slice(0, 3).map(e => `${e.index}\n${e.start} --> ${e.end}\n${e.text}`).join('\n\n');
        return `${getPromptWithLanguage()}\n\nSRT Sample:\n${srtSample}`;
    }

    // Handler for sending to ChatGPT
    function handleSend() {
        const message = prepareMessage();
        if (testMode) {
            setPendingMessage(message);
            setEditMessage(message);
            setShowPreview(true);
        } else {
            // TODO: Replace with actual send logic
            alert('Sent to ChatGPT:\n' + message);
        }
    }

    // Handler for confirming send in test mode
    function handleConfirmSend() {
        setShowPreview(false);
        // TODO: Replace with actual send logic
        alert('Sent to ChatGPT:\n' + (editMessage || ''));
    }

    // Handler for editing message in test mode
    function handleEditChange(e: any) {
        setEditMessage(e.target.value);
    }

    return (
        <div class="p-4 max-w-2xl mx-auto">
            <h1 class="text-2xl font-bold mb-4">SRT Translator</h1>
            <div class="mb-4 flex items-center gap-4">
                <label class="flex items-center cursor-pointer">
                    <input type="checkbox" checked={testMode} onChange={e => setTestMode((e.target as HTMLInputElement).checked)} class="mr-2" />
                    <span class="font-semibold">Test Mode</span>
                </label>
                <button class="ml-auto px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleSend}>
                    Send to ChatGPT
                </button>
            </div>
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
                {promptJson && 'prompt' in promptJson && 'language' in promptJson && (
                    <div class="mt-2 text-xs text-blue-700">
                        <b>Prompt with language:</b> {getPromptWithLanguage()}
                    </div>
                )}
            </div>
            {/* Test Mode Preview Modal */}
            {showPreview && (
                <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div class="bg-white p-6 rounded shadow-lg max-w-lg w-full">
                        <h2 class="text-lg font-bold mb-2">Test Mode: Preview Message</h2>
                        <textarea class="w-full h-40 p-2 border rounded mb-4 text-xs" value={editMessage || ''} onInput={handleEditChange} />
                        <div class="flex justify-end gap-2">
                            <button class="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowPreview(false)}>Cancel</button>
                            <button class="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleConfirmSend}>Send</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
