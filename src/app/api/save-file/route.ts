import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    const data = await request.json();
    const { fileName, content } = data;

    if (!fileName || !/^[a-zA-Z0-9_-]+\.json$/.test(fileName)) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    if (typeof content !== 'string') {
        return NextResponse.json({ error: 'Content must be a string' }, { status: 400 });
    }

    try {
        JSON.parse(content);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON content' }, { status: 400 });
    }

    const dataDirectory = path.join(process.cwd(), 'public', 'data');
    const filePath = path.join(dataDirectory, fileName);

    // Security check
    if (path.dirname(filePath) !== dataDirectory) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Beautify JSON before writing
        const parsedContent = JSON.parse(content);
        const prettyContent = JSON.stringify(parsedContent, null, 2);
        fs.writeFileSync(filePath, prettyContent, 'utf8');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error writing file:', error);
        return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }
} 