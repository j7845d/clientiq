
import { Router } from 'express';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { CompetitorReport } from '../../../types';

const router = Router();

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY environment variable is not set in backend. Analysis features may not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

router.post('/analyze-url', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'URL is required for analysis.' });
  }

  try {
    const prompt = `
      You are a senior digital marketing strategist. Your goal is to analyze a competitor's website to find opportunities for a sales pitch.
      Conduct a comprehensive, deep-research analysis of the online presence for the website: ${url}.

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
    
    res.json({ text, sources });
  } catch (error) {
    console.error("Error analyzing URL:", error);
    res.status(500).json({ message: 'Failed to analyze URL. Please ensure it is a valid and accessible website.' });
  }
});

export default router;
