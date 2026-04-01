
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        reactCode: {
            type: Type.STRING,
            description: "The complete, functional React component code as a string. It must be a single .tsx file content.",
        },
    },
    required: ["reactCode"],
};

export async function convertHtmlToReact(html: string): Promise<string> {
    const prompt = `
      Convert the following HTML code into a single, complete, and functional React component using TypeScript (.tsx).

      **Conversion Rules:**
      1.  **Component Definition:** Create a functional component.
      2.  **Styling:** Convert all inline 'style' attributes and standard CSS classes into the equivalent Tailwind CSS utility classes.
      3.  **Attributes:** Change the 'class' attribute to 'className'.
      4.  **Self-closing tags:** Ensure tags like <img>, <br>, <hr> are self-closing (e.g., <img ... />).
      5.  **Output Format:** The output MUST be a single string containing only the raw TypeScript code for the component. Do not wrap it in markdown backticks (\`\`\`tsx ... \`\`\`) or any other formatting.
      6.  **Imports:** Assume 'React' is imported. Do not add any other imports unless absolutely necessary.
      7.  **Structure:** Return only the component function. No extra exports or surrounding text.

      **HTML to Convert:**
      \`\`\`html
      ${html}
      \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        if (parsed && typeof parsed.reactCode === 'string') {
            return parsed.reactCode;
        } else {
            throw new Error("Invalid response format from API.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI model. Check the console for details.");
    }
}
