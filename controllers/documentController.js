const { uploadFile } = require('../services/ipfsService');
const { storeCID, verifyDocument,getTotalContracts, getContract } = require('../services/blockchainService');
const Web3 = require('web3');

exports.getAllDocuments = async (req, res) => {
  try {
    const total = await getTotalContracts();
    const docs = [];

    for (let i = 0; i < total; i++) {
      const raw = await getContract(i);

      const doc = {
        cid: raw.cid || raw[0],
        uploader: raw.uploader || raw[1],
        timestamp: Number(raw.timestamp || raw[2]),
      };

      docs.push(doc);
    }

    res.json(docs);
  } catch (err) {
    console.error("❌ Error in getAllDocuments:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};



exports.uploadDocument = async (req, res) => {
  try {
    console.log("📥 [uploadDocument] File received:", req.file);

    if (!req.file) {
      console.error("❌ No file found in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { buffer, originalname } = req.file;

    // Upload file lên IPFS qua Pinata
    const cid = await uploadFile(buffer, originalname);

    // Tính hash nếu cần xác minh sau
    const hash = Web3.utils.keccak256(cid);

    console.log("✅ IPFS CID:", cid);
    console.log("🔒 Document hash:", hash);

    // Gửi CID gốc lên smart contract (có kiểm tra trùng lặp)
    const result = await storeCID(cid);

    if (result.alreadyStored) {
      console.warn("⚠️ CID đã tồn tại trên blockchain, không cần lưu lại");
      return res.status(200).json({
        message: "CID already exists on blockchain.",
        cid,
        hash: result.hash,
        alreadyStored: true
      });
    }

    res.status(200).json({
      message: 'Uploaded successfully',
      cid,
      hash: result.hash
    });

  } catch (err) {
    console.error("❌ Error in uploadDocument:", err);
    console.error("🧠 Stack trace:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.verify = async (req, res) => {
  try {
    console.log("📥 [verify] File received:", req.file);

    if (!req.file) {
      console.error("❌ No file found in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { buffer } = req.file;
    const hash = Web3.utils.keccak256(buffer);
    console.log("🔍 Verifying hash:", hash);

    const isValid = await verifyDocument(hash);
    res.json({ isValid });

  } catch (err) {
    console.error("❌ Error in verify:", err);
    console.error("🧠 Stack trace:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
