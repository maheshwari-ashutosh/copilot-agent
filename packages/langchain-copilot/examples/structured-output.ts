import { CopilotChatModel } from "langchain-copilot";
import { z } from "zod";

const schema = z.object({
  answer: z.string(),
  confidence: z.number()
});

const model = new CopilotChatModel({
  copilot: {
    model: "gpt-5-mini",
    allowAll: true
  }
});

const structured = model.withStructuredOutput(schema);
const result = await structured.invoke("Summarize the repo in one sentence.");

console.log(result);
