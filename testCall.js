const Web3 = require("web3");
const contractABI = require("./abi/contract.json");
const web3 = new Web3("https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID");

const contract = new web3.eth.Contract(contractABI, "YOUR_CONTRACT_ADDRESS");

async function test() {
  const total = await contract.methods.getTotalContracts().call();
  console.log("📦 Total contracts:", total);

  const doc = await contract.methods.getContract(0).call();
  console.log("📄 First doc:", doc);
}

test();
