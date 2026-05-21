import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs/promises";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { workspacePath } = await req.json();
    const targetDir = workspacePath || path.join(os.homedir(), "rogue_workspace");

    // Ensure workspace directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Check if hardhat is already initialized (package.json exists)
    const pkgPath = path.join(targetDir, "package.json");
    let alreadyInitialized = false;
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
      if (pkg.devDependencies?.hardhat || pkg.dependencies?.hardhat) {
        alreadyInitialized = true;
      }
    } catch {
      // package.json doesn't exist yet — proceed with init
    }

    if (alreadyInitialized) {
      return NextResponse.json({
        status: "already_initialized",
        message: "Hardhat project already exists in workspace.",
        workspacePath: targetDir
      });
    }

    // Initialize a minimal Hardhat project non-interactively
    await execAsync("npm init -y", { cwd: targetDir });
    await execAsync("npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox", {
      cwd: targetDir,
      timeout: 120000 // 2 min timeout for npm install
    });

    // Write a minimal hardhat.config.js
    const hardhatConfig = `require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
`;
    await fs.writeFile(path.join(targetDir, "hardhat.config.js"), hardhatConfig);

    // Create contracts/ and test/ directories with starter files
    await fs.mkdir(path.join(targetDir, "contracts"), { recursive: true });
    await fs.mkdir(path.join(targetDir, "test"), { recursive: true });

    const starterContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Drop your target contract here for Black-Hat analysis
contract Target {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount; // <-- intentional reentrancy vuln for demo
    }
}
`;
    await fs.writeFile(
      path.join(targetDir, "contracts", "Target.sol"),
      starterContract
    );

    return NextResponse.json({
      status: "success",
      message: "Hardhat project initialized in workspace.",
      workspacePath: targetDir,
      files: ["hardhat.config.js", "contracts/Target.sol", "test/"]
    });

  } catch (err: unknown) {
    return NextResponse.json({
      error: "Web3 scaffold failed",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
