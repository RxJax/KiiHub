const path = require("path");
const fs = require("fs");
const solc = require("solc");

const contractsDir = path.resolve(__dirname, "contracts");
const outputFilePath = path.resolve(__dirname, "src", "contexts", "compiled_contracts.json");

const files = fs.readdirSync(contractsDir);
const sources = {};

files.forEach((file) => {
  if (file.endsWith(".sol")) {
    const contractPath = path.resolve(contractsDir, file);
    const content = fs.readFileSync(contractPath, "utf8");
    sources[file] = { content };
  }
});

const input = {
  language: "Solidity",
  sources,
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

console.log("Compiling contracts using solc...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach((err) => {
    console.error(err.formattedMessage);
  });
  if (output.errors.some(err => err.severity === 'error')) {
    process.exit(1);
  }
}

const compiledContracts = {};

Object.keys(output.contracts).forEach((fileName) => {
  Object.keys(output.contracts[fileName]).forEach((contractName) => {
    const contractData = output.contracts[fileName][contractName];
    compiledContracts[contractName] = {
      abi: contractData.abi,
      bytecode: "0x" + contractData.evm.bytecode.object,
    };
  });
});

fs.writeFileSync(outputFilePath, JSON.stringify(compiledContracts, null, 2), "utf8");
console.log("Successfully compiled all contracts and updated compiled_contracts.json!");
