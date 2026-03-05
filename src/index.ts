import { Command } from "commander";
import { login } from "./auth.js";
import { loadCredentials, clearCredentials } from "./credentials.js";
import { fetchManifest } from "./manifest.js";
import { registerDynamicCommands } from "./commands.js";

const program = new Command();

program
  .name("ai-todo")
  .description("CLI for AI agents to interact with ai-todo")
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate with ai-todo via browser")
  .option("--token <jwt>", "Directly provide a JWT token (for headless environments)")
  .action(async (opts: { token?: string }) => {
    await login(opts.token);
  });

program
  .command("logout")
  .description("Clear stored credentials")
  .action(() => {
    clearCredentials();
    console.log(JSON.stringify({ success: true, message: "Logged out" }));
  });

program
  .command("whoami")
  .description("Show current authenticated user")
  .action(() => {
    const creds = loadCredentials();
    if (!creds) {
      console.log(JSON.stringify({ error: "Not logged in. Run: ai-todo login" }));
      process.exit(2);
    }
    console.log(JSON.stringify({
      user_id: creds.user_id,
      email: creds.email,
    }));
  });

async function main() {
  // If only running auth commands, skip manifest fetch
  const authCommands = ["login", "logout", "whoami", "help", "--help", "-h", "--version", "-V"];
  const firstArg = process.argv[2];

  if (!firstArg || authCommands.includes(firstArg)) {
    await program.parseAsync(process.argv);
    return;
  }

  try {
    const manifest = await fetchManifest();
    registerDynamicCommands(program, manifest.operations);
  } catch {
    console.log(JSON.stringify({ error: "Failed to load commands from server" }));
    process.exit(1);
  }

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.log(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }));
  process.exit(1);
});
