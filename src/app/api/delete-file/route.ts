import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName || !/^[a-zA-Z0-9_-]+\.json$/.test(fileName)) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const dataDirectory = path.join(process.cwd(), 'public', 'data');
    const filePath = path.join(dataDirectory, fileName);

    // Security check
    if (path.dirname(filePath) !== dataDirectory) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        fs.unlinkSync(filePath);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        console.error('Error deleting file:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
} 