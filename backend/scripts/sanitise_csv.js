const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const inputFile = process.argv[2] || './scripts/csv_two.csv'; // Default to input.csv if no file provided
const outputFile = process.argv[3] || './scripts/filtered_tweets_two.txt'; // Default output file

// Regular expressions for detecting mentions and links
const mentionRegex = /@\w+/;
const linkRegex = /https?:\/\/[^\s]+/;

async function processCsv() {
  try {
    // Create read stream and interface
    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    // Create write stream
    const writeStream = fs.createWriteStream(outputFile);
    
    console.log(`Processing ${inputFile}...`);
    let count = 0;
    let matchCount = 0;

    // Process each line
    for await (const line of rl) {
      count++;
      
      // Parse CSV line - handling quoted fields properly
      const fields = parseCSVLine(line);
      
      if (fields.length < 6) {
        console.warn(`Line ${count}: Invalid format, skipping`);
        continue;
      }
      
      // Get the tweet text (last field)
      const tweetText = fields[5];
      
      // Check if it contains a mention or link
      if (!mentionRegex.test(tweetText) && !linkRegex.test(tweetText)) {
        writeStream.write(tweetText + '\n');
        matchCount++;
      }
    }
    
    writeStream.end();
    console.log(`Processing complete!`);
    console.log(`Processed ${count} lines`);
    console.log(`Found ${matchCount} tweets with mentions or links`);
    console.log(`Results saved to ${outputFile}`);
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Function to properly parse CSV lines with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

// Run the script
processCsv().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
