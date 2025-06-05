export const translatorPromptTemplate = ({
    sourceLanguage,
    targetLanguage,
    reason,
    suggestion,
}: {
    sourceLanguage: string;
    targetLanguage: string;
    reason: string;
    suggestion: string;
}) => `
You are a translation assistant. Given the following input, translate the \"reason\" and \"suggestion\" fields from ${sourceLanguage} to ${targetLanguage}. Return the result as a JSON object with the same keys.

Input:
{{
  \"reason\": \"${reason}\",
  \"suggestion\": \"${suggestion}\"
}}

Output (in JSON):
{{
  \"reason\": \"<translated_reason>\",
  \"suggestion\": \"<translated_suggestion>\"
}}

Only return the JSON object, nothing else.
`;
