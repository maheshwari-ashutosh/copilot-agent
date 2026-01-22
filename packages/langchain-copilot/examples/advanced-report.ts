import { CopilotChatModel } from "langchain-copilot";
import { tool } from "@langchain/core/tools";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";

const companyLookup = tool(
  async (input: { ticker: string }) => {
    // Stubbed data for demo purposes.
    const data: Record<string, { revenueUsd: number; fiscalYear: string }> = {
      AAPL: { revenueUsd: 383_000_000_000, fiscalYear: "FY2023" },
      MSFT: { revenueUsd: 212_000_000_000, fiscalYear: "FY2023" },
      AMZN: { revenueUsd: 575_000_000_000, fiscalYear: "FY2023" },
    };
    return data[input.ticker.toUpperCase()] ?? { revenueUsd: 0, fiscalYear: "unknown" };
  },
  {
    name: "company_lookup",
    description: "Return latest annual revenue in USD for a public company ticker.",
    schema: z.object({ ticker: z.string().min(1) }),
  }
);

const fxRate = tool(
  async (input: { from: string; to: string }) => {
    const key = `${input.from.toUpperCase()}_${input.to.toUpperCase()}`;
    const rates: Record<string, number> = {
      USD_EUR: 0.93,
      USD_GBP: 0.79,
    };
    return { pair: key, rate: rates[key] ?? 1 };
  },
  {
    name: "fx_rate",
    description: "Return an FX rate between two currencies.",
    schema: z.object({ from: z.string(), to: z.string() }),
  }
);

const model = new CopilotChatModel({
  copilot: {
    model: "gpt-5-mini",
    allowAll: true,
  },
  logger: (event) => {
    console.log(`[${event.timestamp}]`, event.type, event);
  },
});

const toolEnabled = model.bindTools([companyLookup, fxRate], { tool_choice: "any" });

const userRequest =
  "Compare Apple and Microsoft revenue in USD and EUR. Explain the difference and recommend which has stronger top-line growth.";

const first = await toolEnabled.invoke(userRequest);
const toolCalls = first.tool_calls ?? [];

if (toolCalls.length === 0) {
  console.log("No tool calls returned.");
  process.exit(0);
}

const toolMessages: ToolMessage[] = [];
for (const call of toolCalls) {
  let result: unknown;
  if (call.name === "company_lookup") {
    result = await companyLookup.invoke(call.args as { ticker: string });
  } else if (call.name === "fx_rate") {
    result = await fxRate.invoke(call.args as { from: string; to: string });
  } else {
    result = { error: `Unknown tool: ${call.name}` };
  }

  toolMessages.push(
    new ToolMessage({
      content: JSON.stringify(result),
      tool_call_id: call.id ?? call.name,
      name: call.name,
      status: "success",
    })
  );
}

const reportSchema = z.object({
  summary: z.string(),
  revenue: z.array(
    z.object({
      ticker: z.string(),
      currency: z.string(),
      amount: z.number(),
      fiscalYear: z.string(),
    })
  ),
  recommendation: z.string(),
  assumptions: z.array(z.string()),
});

const structured = model.withStructuredOutput(reportSchema);
const final = await structured.invoke([
  new HumanMessage(userRequest),
  new AIMessage({ content: "", tool_calls: toolCalls }),
  ...toolMessages,
  new HumanMessage("Provide the final report as JSON that matches the schema."),
]);

console.log(final);
