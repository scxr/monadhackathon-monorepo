const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretKey = process.env.PINATA_SECRET_KEY;
const pinataJWT = process.env.PINATA_JWT;

const pinataHeaders = {
    'pinata_api_key': pinataApiKey || "de56609ec9409a9f178a",
    'pinata_secret_api_key': pinataSecretKey || "c005677ff2029a6575ee3073f9416b358882c4bbb60eec43baa60504e245c5ac",
    'Content-Type': 'multipart/form-data',
}

export async function uploadFileToIPFS(filePath: string, fileName: string) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    const metadata = JSON.stringify({
        name: fileName,
    });
    formData.append('pinataMetadata', metadata);

    try {
        const response = await axios.post(`https://api.pinata.cloud/pinning/pinFileToIPFS`, formData, {
            headers: pinataHeaders,
        })
        console.log(`File uploaded to IPFS: ${response.data}`);
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        throw error;
    }
}

// New function to upload base64 encoded images to IPFS
export async function uploadBase64ToIPFS(base64Data: string, fileName: string) {
    try {
        // Remove the data URL prefix if it exists (e.g., "data:image/jpeg;base64,")
        const base64Image = base64Data.includes('base64,') 
            ? base64Data.split('base64,')[1] 
            : base64Data;
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Image, 'base64');
        
        // Create a temporary file path
        const tempFilePath = `./temp_${Date.now()}_${fileName}`;
        
        // Write buffer to temporary file
        fs.writeFileSync(tempFilePath, buffer);
        
        // Upload the file to IPFS
        const ipfsHash = await uploadFileToIPFS(tempFilePath, fileName);
        
        // Delete the temporary file
        fs.unlinkSync(tempFilePath);
        
        return ipfsHash;
    } catch (error) {
        console.error('Error uploading base64 image to IPFS:', error);
        throw error;
    }
}

// For testing purposes only
async function main() {
    const filePath = 'utils/testimg/cat.jpeg';
    const fileName = 'cat.jpeg';

    try {
        const ipfsHash = await uploadFileToIPFS(filePath, fileName);
        console.log(`IPFS Hash: ${ipfsHash}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Comment out the main function call to prevent it from running when imported
// main();


