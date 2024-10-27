const path = require('path');
const fs = require("fs").promises;
const solc = require("solc");

async function main() {
    const contractName = 'Lottery';
    const contractFileName = `${contractName}.sol`;

    // Load the contract source code
    const storagePath = path.resolve(__dirname, 'contracts', contractFileName);
    const sourceCode = await fs.readFile(storagePath, 'utf8');
    // Compile the source code and retrieve the ABI and Bytecode
    const { abi, bytecode } = compile(sourceCode, contractName);
    // Store the ABI and Bytecode into a JSON file
    const artifact = JSON.stringify({ abi, bytecode }, null, 2);
    await fs.writeFile(contractName + ".json", artifact);
}

function compile(sourceCode, contractName) {
    // Create the Solidity Compiler Standard Input and Output JSON
    const input = {
        language: "Solidity",
        sources: { main: { content: sourceCode } },
        settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
    };
    // Parse the compiler output to retrieve the ABI and Bytecode
    const output = solc.compile(JSON.stringify(input));
    const artifact = JSON.parse(output).contracts.main[contractName];
    return {
        abi: artifact.abi,
        bytecode: artifact.evm.bytecode.object,
    };
}

main()