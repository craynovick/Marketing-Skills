import { WorkflowAgent, type ModelCallStreamPart } from "@ai-sdk/workflow";
import { jsonSchema, stepCountIs, tool, type ToolSet, type UIMessage } from "ai";
import { getWorkflowMetadata, getWritable } from "workflow";
import { claimRun, resolveContextScope, prepareAgent, executeAgentTool, persistStep, finishRun, closeFailedStream, summarizeConversation } from "./cookbook-steps";

export async function cookbookWorkflow(runId: string) {
  "use workflow";
  try {
    if (!await claimRun(runId, getWorkflowMetadata().workflowRunId)) return;
    await resolveContextScope(runId);
    await summarizeConversation(runId);
    let setup = await prepareAgent(runId);
    const tools: ToolSet = Object.fromEntries(setup.specs.map(spec => [spec.name, tool({
      description: spec.description, inputSchema: jsonSchema(spec.schema),
      execute: (input, options) => executeAgentTool(runId, spec.name, input, options.toolCallId),
    })]));
    let awaitingInput = false;
    let switchedScope = false;
    const agent = new WorkflowAgent({
      model: setup.model, instructions: setup.instructions, tools,
      maxOutputTokens: 6000,
      prepareStep: async () => {
        if (switchedScope) { setup = await prepareAgent(runId); switchedScope = false; }
        return { instructions: setup.instructions, activeTools: setup.scope === "task" ? ["loadSkill","scrapeWebsite","saveSkillMarkdown","askQuestion","useTaskOnlyContext"] : Object.keys(tools) };
      },
      onStepEnd: async step => {
        const parts: UIMessage["parts"] = step.text ? [{ type: "text", text: step.text }] : [];
        for (const call of step.toolCalls) {
          const result = step.toolResults.find(r=>r.toolCallId===call.toolCallId);
          parts.push({ type: "dynamic-tool", toolName: call.toolName, toolCallId: call.toolCallId, input: call.input,
            ...(result ? { state: "output-available" as const, output: result.output } : { state: "output-error" as const, errorText: "This step did not finish." }) });
          if (result && ["askQuestion","proposeBrandUpdates"].includes(call.toolName)) awaitingInput = true;
          if (result && call.toolName === "useTaskOnlyContext") switchedScope = true;
        }
        await persistStep(runId, step.stepNumber, parts, { inputTokens: step.usage.inputTokens, outputTokens: step.usage.outputTokens, elapsedMs: step.performance?.stepTimeMs });
      },
    });
    await agent.stream({ messages: setup.messages, writable: getWritable<ModelCallStreamPart>(),
      stopWhen: [stepCountIs(10), () => awaitingInput] });
    await finishRun(runId, awaitingInput ? "awaiting_input" : "completed");
  } catch (error) {
    const cause = error instanceof Error ? error.message : "Unknown workflow failure";
    console.error("Cookbook workflow", { runId, status: "failed", cause });
    try {
      await finishRun(runId, "failed", "Generation could not finish. Review saved changes and retry.");
    } catch (statusError) {
      console.error("Cookbook workflow", { runId, stage: "record-failure", status: "failed", cause: statusError instanceof Error ? statusError.message : "Unknown persistence failure" });
    }
    await closeFailedStream(getWritable<ModelCallStreamPart>());
  }
}
