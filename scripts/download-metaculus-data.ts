import fs from "fs";
import path from "path";

const METACULUS_API = "https://www.metaculus.com/api";
const QUESTION_ID = 30960; // From config.ts
const OUTPUT_DIR = path.join(process.cwd(), "data");

// You'll need to get this from your browser after logging into Metaculus
// Go to metaculus.com, open dev tools, look at any API request headers
if (!process.env.METACULUS_API_KEY) {
  console.error("Please set METACULUS_API_KEY environment variable");
  process.exit(1);
}

async function downloadMetaculusData() {
  try {
    const params = new URLSearchParams({
      aggregation_methods: "unweighted",
      minimize: "false",
      include_comments: "false",
    });

    const url = `${METACULUS_API}/posts/${QUESTION_ID}/download-data/?${params}`;
    console.log("Fetching from URL:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${process.env.METACULUS_API_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText}\nResponse: ${text}`,
      );
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write the zip file
    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join(OUTPUT_DIR, `metaculus-${QUESTION_ID}.zip`);
    fs.writeFileSync(outputPath, buffer);

    console.log(`Downloaded data to ${outputPath}`);
  } catch (error) {
    console.error("Error downloading Metaculus data:", error);
    process.exit(1);
  }
}

downloadMetaculusData();
