export async function validateResponse(response: string, context: string): Promise<{ response: string, warning?: string }> {
    // Check 1: Did LLM hallucinate a feature not in context?
    const suspiciousPhrases = [
        "you can also",
        "additionally",
        "furthermore",
        "another option is"
    ];

    const mightBeHallucinating = suspiciousPhrases.some(phrase =>
        response.toLowerCase().includes(phrase)
    );

    // Check 2: Is response too generic?
    const genericPhrases = [
        "typically",
        "usually",
        "in general",
        "most platforms"
    ];

    const isTooGeneric = genericPhrases.some(phrase =>
        response.toLowerCase().includes(phrase)
    );

    let warning;
    if (mightBeHallucinating) {
        warning = "⚠️ Response might contain information not in docs";
    } else if (isTooGeneric) {
        warning = "⚠️ Response is generic, might need better context";
    }

    return { response, warning };
}