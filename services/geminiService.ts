
import { GoogleGenAI } from "@google/genai";
import { Student, PaymentRecord, FeeStructure } from "../types";

const getAIClient = () => {
  let apiKey = '';
  try {
    // Safe access to API Key in browser environment
    // Bundlers typically replace process.env.API_KEY with a string literal
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore errors accessing process
  }
  
  if (!apiKey) {
      // Quietly fail if no key is present to avoid crashing app
      return null;
  }

  try {
      // Ensure the imported object is constructable
      if (typeof GoogleGenAI !== 'function') {
          console.error("GoogleGenAI is not a valid constructor");
          return null;
      }
      return new GoogleGenAI({ apiKey });
  } catch (error) {
      console.error("Error initializing Gemini Client:", error);
      return null;
  }
};

export const generateFinancialInsight = async (
  totalCollected: number, 
  totalPending: number, 
  students: Student[]
): Promise<string> => {
  try {
    const ai = getAIClient();
    if (!ai) return "AI Insight unavailable (Configuration missing).";

    const prompt = `
      You are a financial analyst for a school. 
      Here is the current fee status:
      - Total Collected: ₹${totalCollected}
      - Total Pending: ₹${totalPending}
      - Total Students: ${students.length}
      
      Provide a brief, professional 3-sentence summary of the financial health and one actionable recommendation for improving fee collection.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate insight.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insight.";
  }
};

export const draftPaymentReminder = async (
  studentName: string, 
  amountDue: number, 
  dueDate: string
): Promise<string> => {
  try {
    const ai = getAIClient();
    if (!ai) return "Reminder unavailable (Configuration missing).";

    const prompt = `
      Draft a polite but firm email reminder for school fees.
      Student: ${studentName}
      Amount Due: ₹${amountDue}
      Due Date: ${dueDate}
      
      Keep it under 100 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not draft reminder.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error drafting reminder.";
  }
};
