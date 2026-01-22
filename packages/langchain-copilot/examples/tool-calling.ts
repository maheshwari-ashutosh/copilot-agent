import { CopilotChatModel } from "langchain-copilot";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const search = tool(
  async (input: { query: string }) => {
    return `search(${input.query})`;
  },
  {
    name: "search",
    description: "Search the web for information.",
    schema: z.object({ query: z.string() })
  }
);

const model = new CopilotChatModel({
  copilot: {
    model: "gpt-5-mini",
    allowAll: true
  }
});

const toolEnabled = model.bindTools([search]);
const response = await toolEnabled.invoke("Find the capital of France and cite the source.");

console.log(response);
