import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { code, language } = await req.json();
    
    const tmpDir = /* turbopackIgnore: true */ os.tmpdir();
    let fileName = 'script.txt';
    let command = '';
    
    const lowerLang = language.toLowerCase();
    if (lowerLang === 'python' || lowerLang === 'py') {
      fileName = `script_${Date.now()}.py`;
      command = `python3 "${tmpDir}/${fileName}"`;
    } else if (lowerLang === 'bash' || lowerLang === 'sh') {
      fileName = `script_${Date.now()}.sh`;
      command = `bash "${tmpDir}/${fileName}"`;
    } else if (lowerLang === 'javascript' || lowerLang === 'js' || lowerLang === 'typescript' || lowerLang === 'ts') {
      fileName = `script_${Date.now()}.js`;
      command = `node "${tmpDir}/${fileName}"`;
    } else {
      return NextResponse.json({ error: `Execution for language '${language}' is not supported in the local sandbox yet.` }, { status: 400 });
    }
    
    const filePath = `${tmpDir}/${fileName}`;
    fs.writeFileSync(filePath, code);
    
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 120000, maxBuffer: 50 * 1024 * 1024 }); // 120 sec timeout, 50MB max output
      return NextResponse.json({ stdout, stderr });
    } catch (execError: any) {
      // If the command fails, child_process throws an error but it contains stdout/stderr
      return NextResponse.json({ 
        stdout: execError.stdout || "", 
        stderr: execError.stderr || execError.message 
      });
    } finally {
      // Cleanup
      try { fs.unlinkSync(filePath); } catch {}
    }
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
