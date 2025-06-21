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
    const [promptData, setPromptData] = useState(null);

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
                                    onClick={() => {
                                        const msg = prepareMessageForEntry(e);
                                        // eslint-disable-next-line no-console
                                        console.log(msg);
                                    }}
                                >
                                    <td class="px-2 py-1 border-b align-top">{e.index}</td>
                                    <td class="px-2 py-1 border-b align-top whitespace-nowrap">{e.start} <br />→ {e.end}</td>
                                    <td class="px-2 py-1 border-b align-top">{e.text}</td>
                                    <td class="px-2 py-1 border-b align-top text-blue-700 italic">{/* Translated content placeholder */}</td>
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
