const Web3 = require('web3');
const contractABI = require('../abi/contract.json');
require('dotenv').config();
const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

const contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);

// Hàm lưu CID vào blockchain
async function storeCID(cid) {
  console.log("🔒 Adding document with CID:", cid);

  try {
    // Tính hash trước khi gửi
    const hash = web3.utils.keccak256(cid);
    console.log("🔑 Document hash:", hash);

    // Kiểm tra trùng lặp
    const isStored = await contract.methods.verifyDocument(hash).call();
    if (isStored) {
      console.warn("⚠️ CID đã tồn tại trên blockchain, bỏ qua lưu");
      return { alreadyStored: true, hash };
    }

    const tx = contract.methods.storeCID(cid);
    const gas = await tx.estimateGas({ from: account.address });
    const data = tx.encodeABI();

    const txData = {
      from: account.address,
      to: process.env.CONTRACT_ADDRESS,
      data: data,
      gas,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txData, process.env.PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log("📤 Transaction successful:", receipt);
    return { receipt, hash };
  } catch (err) {
    console.error("❌ Error in storeCID:", err);
    throw err;
  }
}


// Hàm xác minh document bằng CID hoặc file hash
async function verifyDocument(hashInput) {
  try {
    let hash;
    if (typeof hashInput === 'string' && hashInput.startsWith('0x')) {
      hash = hashInput; // đã là hash
    } else {
      hash = web3.utils.keccak256(hashInput); // tính hash từ buffer hoặc CID
    }

    console.log("🔎 Verifying hash:", hash);
    const result = await contract.methods.verifyDocument(hash).call();
    console.log("✅ Document verification result:", result);
    return result;
  } catch (err) {
    console.error("❌ Error in verifyDocument:", err);
    throw err;
  }
}

// Hàm lưu CID lên smart contract, nếu chưa tồn tại
async function addDocument(cid) {
  const hash = web3.utils.keccak256(cid);
  console.log("📦 Hash lưu:", hash);

  try {
    const exists = await contract.methods.verifyDocument(hash).call();
    if (exists) {
      console.warn("⚠️ CID đã tồn tại. Bỏ qua gửi transaction.");
      return { alreadyExists: true };
    }

    const tx = contract.methods.storeCID(cid);
    const gas = await tx.estimateGas({ from: account.address });
    const data = tx.encodeABI();

    const txData = {
      from: account.address,
      to: process.env.CONTRACT_ADDRESS,
      data: data,
      gas,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txData, process.env.PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return { receipt };
  } catch (err) {
    console.error("❌ Lỗi trong addDocument:", err.message || err);
    // ❗ Không throw lỗi, chỉ log — để frontend vẫn tiếp tục
    return { error: true, message: err.message || "Giao dịch thất bại" };
  }
}


// hàm lấy hợp đồng
async function getTotalContracts() {
  return await contract.methods.getTotalContracts().call();
}

async function getContract(index) {
  return await contract.methods.getContract(index).call();
}

module.exports = {
  storeCID,
  verifyDocument,
  getTotalContracts,
  getContract,
  addDocument
};

