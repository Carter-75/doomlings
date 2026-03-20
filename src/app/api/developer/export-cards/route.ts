import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { cards, githubToken } = await request.json();

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'No cards provided' }, { status: 400 });
    }

    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub Token is required' }, { status: 400 });
    }

    const repoOwner = 'Carter-75';
    const repoName = 'doomlings';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `public/data/generated_cards/new_cards_${timestamp}.json`;
    const message = `Add new scanned cards from developer tool - ${timestamp}`;
    
    // Prepare bitstream of the JSON
    const content = Buffer.from(JSON.stringify(cards, null, 2)).toString('base64');

    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Doomlings-App',
          'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
          message,
          content,
          branch: 'main'
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API Response Error:', errorText);
        let errorMsg = 'GitHub API error';
        try {
            const errorJson = JSON.parse(errorText);
            errorMsg = errorJson.message || errorMsg;
        } catch(e) {}
        return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    return NextResponse.json({ success: true, fileName });
  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
