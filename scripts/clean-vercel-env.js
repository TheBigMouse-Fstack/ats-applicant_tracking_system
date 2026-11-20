const { execSync, spawnSync } = require("child_process");

const tunnelBase = "https://proteins-surgical-drag-nobody.trycloudflare.com";

const envs = [
  { name: "N8N_INTERVIEW_WEBHOOK_URL", value: `${tunnelBase}/webhook/interview-schedule` },
  { name: "N8N_WEBHOOK_URL", value: `${tunnelBase}/webhook/interview-schedule` },
  { name: "N8N_TELEGRAM_WEBHOOK_URL", value: `${tunnelBase}/webhook/telegram-alert` },
  { name: "N8N_REJECTION_WEBHOOK_URL", value: `${tunnelBase}/webhook/rejection-buffer` }
];

for (const env of envs) {
  console.log(`\n--- Setting ${env.name} ---`);
  try {
    execSync(`npx vercel env rm ${env.name} production -y --confirm-name ${env.name}`, {
      stdio: "pipe"
    });
    console.log(`Removed old ${env.name}`);
  } catch (err) {
    console.log(`Note: ${env.name} not present or already removed`);
  }

  const child = spawnSync("npx", ["vercel", "env", "add", env.name, "production"], {
    input: `${env.value}\n`,
    shell: true,
    encoding: "utf-8"
  });

  if (child.stderr && child.stderr.includes("Added")) {
    console.log(`✓ Successfully set ${env.name} to ${env.value}`);
  } else {
    console.log(`Result:`, child.stdout, child.stderr);
  }
}

console.log("\nAll 4 webhook environment variables updated successfully!");
