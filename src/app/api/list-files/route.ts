import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const publicDir = path.join(process.cwd(), 'public');
        const files = fs.readdirSync(publicDir);
        // Filter for any relevant files if needed, or just return basics
        // For game state saves, we use Capacitor Preferences which are in-memory/native storage,
        // but the Settings page logic seems to want to list some JSON files too.
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        return NextResponse.json(jsonFiles);
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json([], { status: 500 });
    }
}
