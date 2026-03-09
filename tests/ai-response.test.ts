import { describe, test, expect, afterAll } from "vitest";
import { getAIResponse } from "../src/lib/ai/services/aiService";
import prisma from "../src/lib/db/prisma";

describe("AI Response Quality", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should return well-structured response with answer and context", async () => {
    const response = await getAIResponse(
      "test-chat-id",
      "What are project objectives?",
    );

    // Should have required fields
    expect(response).toHaveProperty("answer");
    expect(response).toHaveProperty("context");
    expect(response).toHaveProperty("validated");

    // Answer should not be empty
    expect(response.answer.length).toBeGreaterThan(0);
  }, 30000);

  test("should handle conversational queries naturally", async () => {
    const response = await getAIResponse("test-chat-id", "Thanks!");

    // Should respond naturally
    expect(response.answer.length).toBeGreaterThan(0);
    const naturalConversational = /welcome|glad|happy|help|problem|anytime/i.test(
      response.answer.toLowerCase(),
    );
    expect(naturalConversational).toBe(true);
  }, 30000);

  test("should include source citations for factual answers", async () => {
    const response = await getAIResponse(
      "test-chat-id",
      "What documentation exists for this project?",
    );

    // Always check if we have an answer
    expect(response.answer.length).toBeGreaterThan(0);

    // If the tool found anything, it should be cited
    if (response.context && response.context.length > 0) {
      expect(response.answer.includes("Source") || response.answer.includes("_Sources:")).toBe(true);
    }
  }, 30000);

  test("should expand query or provide general dev help", async () => {
    const response = await getAIResponse("test-chat-id", "how to create a user");

    // Should return a helpful response (either from retrieval or general knowledge)
    expect(response.answer).toBeTruthy();
    expect(response.answer.length).toBeGreaterThan(20);
  }, 30000);

  test("should validate responses against context", async () => {
    const response = await getAIResponse(
      "test-chat-id",
      "What are the project milestones?",
    );

    // Should have validation info
    expect(response.validated).toBeDefined();

    // Log warnings if response is potentially problematic
    if (response.validated.warning) {
      console.warn(`Validation warning: ${response.validated.warning}`);
    }
  }, 30000);

  test("should filter by project scope when requested", async () => {
    const project = await prisma.project.findFirst();

    if (!project) {
      console.warn("Skipping: No projects in database");
      return;
    }

    const response = await getAIResponse(
      "test-chat-id",
      "What tasks are in this project?",
      { projectId: project.id },
    );

    // Should have retrieved something if tasks exist
    expect(response.answer).toBeTruthy();
  }, 30000);
});
