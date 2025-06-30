import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    // Correctly resolve the path to the public/data directory
    const dataDirectory = path.join(process.cwd(), 'public', 'data');

    try {
        const files = fs.readdirSync(dataDirectory);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        return NextResponse.json(jsonFiles);
    } catch (error) {
        console.error('Error reading data directory:', error);
        return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }
} 