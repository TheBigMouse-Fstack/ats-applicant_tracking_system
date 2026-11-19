import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

async function main() {
  console.log("--- 1. Initializing Files SDK with Neon Object Storage ---");
  const files = new Files({ adapter: neon({ bucket: "uploads" }) });

  const fileName = "test-upload.txt";
  const fileContent = "RecoverX ATS — Neon Object Storage Upload Test: SUCCESS at " + new Date().toISOString();

  console.log(`--- 2. Uploading test file: ${fileName} ---`);
  await files.upload(fileName, fileContent, {
    contentType: "text/plain; charset=utf-8",
  });
  console.log("Upload completed successfully!");

  console.log("--- 3. Listing bucket contents ---");
  const listResult = await files.list();
  console.log("Bucket items:", listResult.items.map(item => ({ key: item.key, size: item.size })));

  console.log(`--- 4. Reading file back: ${fileName} ---`);
  const downloaded = await files.download(fileName);
  const textContent = await downloaded.text();

  console.log("Downloaded file content:");
  console.log("------------------------------------------");
  console.log(textContent);
  console.log("------------------------------------------");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
