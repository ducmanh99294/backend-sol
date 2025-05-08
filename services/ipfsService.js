const axios = require('axios');
const FormData = require('form-data');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error("❗️ Missing Pinata API credentials in environment variables.");
}

async function uploadFile(buffer, name) {
  try {
    console.log("📤 Uploading to Pinata:", name);

    const formData = new FormData();
    formData.append('file', buffer, name);

    const metadata = JSON.stringify({ name });
    formData.append('pinataMetadata', metadata);

    const headers = {
      ...formData.getHeaders(),
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET,
    };

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      { headers }
    );

    console.log("✅ Pinata response:", response.data);
    return response.data.IpfsHash;

  } catch (err) {
    console.error("❌ Error uploading to Pinata:", err.response?.data || err.message);
    throw new Error("Failed to upload file to IPFS via Pinata");
  }
}

module.exports = { uploadFile };
