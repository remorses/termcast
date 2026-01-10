// Runs a Claude Agent SDK query and logs every event.
import { query } from "@anthropic-ai/claude-agent-sdk";

const prompt = "Please run the command `ls --color=always` and return the output.";

async function main(): Promise<void> {
  const stream = query({
    prompt,
    options: {
      cwd: process.cwd(),
      tools: { type: "preset", preset: "claude_code" },
      allowedTools: ["Bash"],
      canUseTool: async () => {
        return { behavior: "allow" };
      },
    },
  });

  for await (const event of stream) {
    console.log(event);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
