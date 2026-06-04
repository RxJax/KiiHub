const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractsDir = path.join(__dirname, '../contracts');
const outputFilePath = path.join(__dirname, '../src/contexts/compiled_contracts.json');

const files = [
  'ERC20.sol',
  'ERC721.sol',
  'Faucet.sol',
  'PaymentEscrow.sol',
  'DAOGovernance.sol'
];

const sources = {};
for (const file of files) {
  const filePath = path.join(contractsDir, file);
  sources[file] = {
    content: fs.readFileSync(filePath, 'utf8')
  };
}

const input = {
  language: 'Solidity',
  sources: sources,
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    }
  }
};

console.log('Compiling contracts...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasErrors = false;
  for (const error of output.errors) {
    console.error(error.formattedMessage);
    if (error.severity === 'error') {
      hasErrors = true;
    }
  }
  if (hasErrors) {
    process.exit(1);
  }
}

const compiled = {};
for (const file of files) {
  const contractName = file.replace('.sol', '');
  const contractData = output.contracts[file][contractName];
  if (!contractData) {
    console.error(`Failed to find compilation output for ${contractName}`);
    process.exit(1);
  }
  
  compiled[contractName] = {
    abi: contractData.abi,
    bytecode: '0x' + contractData.evm.bytecode.object
  };
  console.log(`Successfully compiled: ${contractName} (Bytecode size: ${contractData.evm.bytecode.object.length / 2} bytes)`);
}

// Make sure output folder exists
const outDir = path.dirname(outputFilePath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outputFilePath, JSON.stringify(compiled, null, 2), 'utf8');
console.log(`Saved compiled outputs to ${outputFilePath}`);
