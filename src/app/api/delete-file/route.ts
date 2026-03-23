import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { fileName } = await request.json();
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, fileName.endsWith('.json') ? fileName : `${fileName}.json`);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
