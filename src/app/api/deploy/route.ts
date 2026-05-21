import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { content, filename, pinataJwt } = await req.json() as { content: string, filename?: string, pinataJwt?: string };

    if (!content) {
      return NextResponse.json({ success: false, error: 'No content provided' }, { status: 400 });
    }

    // If a Pinata JWT is provided, we do a real IPFS pinning.
    if (pinataJwt && pinataJwt.trim() !== '') {
      const formData = new FormData();
      
      // Convert content string to Blob
      const blob = new Blob([content], { type: 'text/plain' });
      formData.append('file', blob, filename || 'ghost_deploy.txt');

      const pinataMetadata = JSON.stringify({
        name: filename || 'Rogue_Studio_Artifact',
        keyvalues: {
          deployedVia: 'RogueStudio'
        }
      });
      formData.append('pinataMetadata', pinataMetadata);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJwt}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.details || 'Pinata API failed. Ensure your JWT is valid.');
      }

      const data = await response.json();
      return NextResponse.json({ 
        success: true, 
        cid: data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
      });
    }

    // fallback: Cypherpunk simulation if no key is provided.
    // In a real local IPFS node, you'd push to localhost:5001 here.
    // We will generate a fake CID for the demo.
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const fakeCid = `Qm${hash.substring(0, 44)}`; // CIDv0 format rough simulation

    return NextResponse.json({ 
      success: true, 
      cid: fakeCid,
      url: `ipfs://${fakeCid}`,
      simulated: true,
      message: 'Simulated IPFS pin. Add Pinata JWT in Settings for persistent global hosting.'
    });

  } catch (error: unknown) {
    console.error('IPFS Deploy Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Deployment failed' }, { status: 500 });
  }
}
