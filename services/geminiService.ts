import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { CompetitorReport, PitchContent, Client, EmailValidationResult, RowValidationResult } from '../types';

if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const analyzeCompetitor = async (businessName: string, location: string): Promise<CompetitorReport> => {
  try {
    const locationInfo = location.trim() ? ` located in or near "${location.trim()}"` : '';
    const prompt = `
      You are a senior digital marketing strategist. Your goal is to analyze a competitor to find opportunities for a sales pitch.
      Conduct a comprehensive, deep-research analysis of the online presence for the business named "${businessName}"${locationInfo}.
      If the business name seems to have a typo, please find the most likely intended business based on the name and location provided. If no specific business can be found, state that and do not proceed.

      Your report must be detailed and structured for a salesperson to use to prepare for a client meeting. Use markdown for formatting. The final two sections are the most important.

      1.  **Business Overview:**
          *   Correct business name and primary website URL.
          *   Brief summary of what the business does.

      2.  **Digital Presence Analysis:**
          *   **Website & SEO:** First impressions of their website's design, UX, mobile-friendliness, and navigation. Note any missing key features (e.g., online booking, e-commerce). Basic SEO check for visibility on key terms.
          *   **Social Media:** List active profiles with links. Analyze their content strategy, engagement levels, and posting frequency.
          *   **Online Reviews:** Summarize sentiment from Google, Yelp, etc. Note recurring themes in positive and negative reviews.

      3.  **Key Weaknesses & Opportunities (Internal Use):**
          *   Based on the analysis, list the top 3-5 most significant weaknesses in their digital presence. Be specific. (e.g., "Website is not mobile-friendly, losing mobile customers," "No recent posts on Instagram for 3 months," "Negative reviews consistently mention slow service").

      4.  **Sales Talking Points (How to Win the Client):**
          *   For each weakness identified above, create a powerful talking point. Frame the weakness as a problem and our agency's service as the solution.
          *   Use a persuasive, consultative tone. Structure it as a "Problem/Solution" pair or a direct script for the salesperson.
          *   **Example Format:**
              *   **Talking Point 1 (Website):** "I noticed your website can be a bit tricky to use on a phone. Did you know over 60% of customers search for businesses like yours on mobile? We can build you a stunning, mobile-friendly site that turns those visitors into paying customers."
              *   **Talking Point 2 (Social Media):** "Your Facebook page has some great content, but it looks like it's been a while since the last update. Consistent posting keeps you top-of-mind. We can manage your social media to keep your audience engaged and attract new followers."
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    
    return { text, sources };
  } catch (error) {
    console.error("Error analyzing competitor:", error);
    throw new Error("Failed to generate competitor analysis. Please check the business name and try again.");
  }
};

export const generatePitch = async (industry: string, clientName?: string, painPoints?: string): Promise<PitchContent> => {
  try {
    const systemInstruction = "You are an expert sales consultant and copywriter specializing in digital solutions for various industries. Your tone is persuasive, knowledgeable, and client-focused.";
    
    let prompt = `Generate a compelling sales pitch for a digital marketing and web development agency targeting the ${industry} industry.`;

    if (clientName) {
      prompt += ` The pitch should be personalized for a company named "${clientName}".`;
    }

    if (painPoints) {
      prompt += ` It's crucial to address the following specific pain points or goals they have: "${painPoints}".`;
    }
    
    prompt += ` The pitch must be structured with the following sections: 
    
    1.  **Introduction:** A powerful opening that grabs their attention.
    2.  **The Challenge:** Detail common online presence and marketing challenges specific to the ${industry} industry. If pain points were provided, integrate them here.
    3.  **Our Solution:** Present our agency's services (like web design, SEO, social media management) as the direct solution to these challenges.
    4.  **Key Benefits:** List tangible benefits with examples relevant to a ${industry} business (e.g., 'more bookings,' 'higher foot traffic,' 'stronger brand trust').
    5.  **Call to Action:** A clear and compelling next step.
    
    Use markdown for formatting (headings, bold text, bullet points).`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
    
    return { text: response.text };
  } catch (error) {
    console.error(`Error generating pitch for ${industry}:`, error);
    throw new Error(`Failed to generate a sales pitch for the ${industry} industry. Please try again.`);
  }
};

export const getSuggestions = async (query: string, type: 'business' | 'location', location?: string): Promise<string[]> => {
  if (query.trim().length < 2) {
    return [];
  }
  try {
    let prompt: string;

    if (type === 'business') {
        const locationContext = location ? ` in or near ${location}` : '';
        prompt = `A user is searching for a business. Their input is "${query}"${locationContext}. Provide up to 5 suggestions for local business names that match this query. The query might be a partial name or a business category (like 'restaurants' or 'plumbers'). Prioritize suggesting actual business names.`;
    } else { // type === 'location'
        prompt = `Based on the user's input "${query}", provide up to 5 auto-completion suggestions for ${'locations (e.g., cities, states)'}. Consider common typos.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A single suggestion string."
              },
              description: "An array of suggestion strings."
            }
          },
        },
        temperature: 0.2
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.suggestions || [];

  } catch (error) {
    console.error(`Error fetching suggestions for "${query}":`, error);
    return [];
  }
};


export const getFollowUpSuggestion = async (clients: Client[]): Promise<{ clientName: string; reason: string }> => {
  if (clients.length === 0) {
    throw new Error("No active clients to analyze.");
  }

  const clientList = clients.map(c => `- ${c.name} (Status: ${c.status}, Value: $${c.value}, Last Contact: ${c.lastContact})`).join('\n');

  const prompt = `
    You are an expert AI Sales Coach. Based on the following list of active sales clients, identify the single most important client to follow up with next.
    Consider factors like deal value, status, and how long it's been since the last contact date (today is ${new Date().toISOString().split('T')[0]}).
    Prioritize clients in 'Follow-up Needed' or 'Proposal Sent' statuses. A client who hasn't been contacted in a while is also a high priority.

    Client List:
    ${clientList}

    Respond in JSON format with two keys: "clientName" (the name of the client to contact) and "reason" (a brief, compelling, one-sentence explanation for why this client is the top priority).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error getting follow-up suggestion:", error);
    throw new Error("Failed to get an AI suggestion. The model may have returned an unexpected format.");
  }
};


export const generateFollowUpEmail = async (client: Client, tone: string, keyPoints?: string): Promise<{ subject: string; body: string; }> => {
  const systemInstruction = "You are a helpful AI assistant for a salesperson. Your task is to draft professional, concise, and effective follow-up emails to clients. The email should be ready to copy and paste.";

  let prompt = `
    Draft a follow-up email to a client.

    **Client Details:**
    - Name: ${client.name}
    - Current Deal Status: ${client.status}
    - Deal Value: $${client.value}
    - Last Contact Date: ${client.lastContact}

    **Email Requirements:**
    - Tone: ${tone}
    - The goal is to re-engage the client and move the deal forward.
    - Keep the email body concise and professional.
    - End with a clear call to action.
  `;

  if (keyPoints) {
    prompt += `\n**Incorporate these key points:**\n- ${keyPoints}`;
  }

  prompt += `
    Respond in a JSON format with two keys: "subject" (a compelling email subject line) and "body" (the full email body text, including a greeting like "Hi ${client.name}," and a sign-off like "Best regards,"). Do not include any extra text or markdown formatting outside of the JSON structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "The email subject line." },
            body: { type: Type.STRING, description: "The full email body text." }
          }
        }
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating follow-up email:", error);
    throw new Error("Failed to generate the email draft. Please try again.");
  }
};

export const verifyEmail = async (email: string): Promise<EmailValidationResult> => {
  const prompt = `
    You are an email validation expert. Analyze the following email address: "${email}".
    Check for:
    1.  Syntactical correctness (RFC 5322).
    2.  If the domain belongs to a known disposable email provider (e.g., mailinator.com, 10minutemail.com).
    3.  If it's a generic role-based email (e.g., info@, support@, contact@, sales@).

    Provide your analysis in a JSON object with two keys:
    - "status": A single string classification from this list: 'Valid', 'Invalid Syntax', 'Risky - Disposable', 'Risky - Role-based'. Choose 'Valid' if it's syntactically correct and not disposable or role-based.
    - "reason": A brief, one-sentence explanation for your classification.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
          }
        },
        temperature: 0.1
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error verifying email:", error);
    throw new Error("Failed to get email verification from AI. The model may have returned an unexpected format.");
  }
};

export const validateClientDataBatch = async (clients: Record<string, string>[]): Promise<RowValidationResult[]> => {
    const prompt = `
      You are a data quality analyst. Your task is to validate a list of potential sales leads. I will provide a JSON array of client data, where each object represents a row from a CSV file. For each client object in the array, please validate its fields based on the following rules.

      **Validation Rules:**
      - The 'Name' or 'Company' field must not be empty or a placeholder like 'N/A'.
      - The 'Email' field must be a valid email format. It should not be a placeholder like 'N/A' or 'Email'.
      - The 'Phone' field should resemble a valid phone number. Placeholders like 'N/A' or single digits are invalid.
      - The 'Website' field, if present and not empty, must be a valid URL format (should start with http, https, or www).

      **Data Batch:**
      ${JSON.stringify(clients.map((client, index) => ({ index, ...client })))} 

      Return a JSON array where each object corresponds to an input client and contains:
      - "originalIndex": The original index of the client in the batch I provided.
      - "isValid": A boolean, true if all checks pass, false otherwise.
      - "issues": An array of strings describing each validation failure. If the row is valid, this should be an empty array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    originalIndex: { type: Type.NUMBER },
                                    isValid: { type: Type.BOOLEAN },
                                    issues: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        }
                    }
                },
                 temperature: 0.0,
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.results;
    } catch (error) {
        console.error("Error validating client data batch:", error);
        throw new Error("Failed to validate data with AI. The model may have returned an unexpected format or the request failed.");
    }
};
export const analyzeCompetitorUrl = async (url: string): Promise<CompetitorReport> => {
  try {
    const response = await fetch('/api/analysis/analyze-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze URL.');
    }

    return response.json();
  } catch (error) {
    console.error("Error analyzing competitor URL:", error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during URL analysis.');
  }
};