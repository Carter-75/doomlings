import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { fileName, content } = await request.json();
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, fileName.endsWith('.json') ? fileName : `${fileName}.json`);
        
        fs.writeFileSync(filePath, content);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving file:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
