import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const tmpIn = join(tmpdir(), `pdfin_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
    await fs.writeFile(tmpIn, buffer);

    try {

    const { stdout } = await execFileAsync("pdftotext", ["-enc", "UTF-8", "-layout", "-nopgbrk", tmpIn, "-"], {
        maxBuffer: 50 * 1024 * 1024,
        });

        const text = stdout
        .replace(/\u000c/g, "\n")      
        .replace(/[ \t]+\n/g, "\n") 
        .replace(/\n{3,}/g, "\n\n")    
        .trim();

        return text;
    } catch (err: any) {
        throw new Error(`pdftotext failed: ${err?.message || err}`);
    } finally {
        fs.unlink(tmpIn).catch(() => {});
    }
}