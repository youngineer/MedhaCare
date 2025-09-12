import type { IAIContext, IAIResponse } from "../types/interfaces.ts";
import { PATIENT_BOT_ENHANCED_PROMPT, THERAPIST_BOT_ENHANCED_PROMPT } from "../utils/constants.ts";

export async function getAiResponse(prompt: string): Promise<any | null> {
  try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      console.error(`AI API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const jsonResponse = await response.json();
    const requiredJson = jsonResponse?.choices[0]?.message?.content;
    
    return getJsonFromAIResponse(requiredJson);
  } catch (e) {
    console.error("Failed to get AI response:", e);
    return null;
  }
}

export async function getEnhancedAIResponse(context: IAIContext, userMessage: string): Promise<IAIResponse | null> {
  try {
    
    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return null;
    }

    // Build context-aware prompt
    const contextualPrompt = buildContextualPrompt(context, userMessage);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          {
            "role": "system",
            "content": getSystemPromptForRole(context.userProfile.role)
          },
          {
            "role": "user",
            "content": contextualPrompt
          }
        ],
        "temperature": 0.7,
        "max_tokens": 1000
      })
    });

    if (!response.ok) {
      console.error(`AI API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return null;
    }

    const jsonResponse = await response.json();
    
    const aiContent = jsonResponse?.choices[0]?.message?.content;
    
    if (!aiContent) {
      console.error("No AI response content received");
      return null;
    }


    // Parse the JSON response from AI
    const parsedResponse = getJsonFromAIResponse(aiContent) as IAIResponse;
    
    // Validate response structure
    if (!parsedResponse) {
      console.error("Failed to parse AI response as JSON");
      return null;
    }

    if (typeof parsedResponse.response !== 'string') {
      console.error("Invalid AI response structure - missing response field");
      console.error('📄 Parsed response:', parsedResponse);
      return null;
    }

    return parsedResponse;

  } catch (error) {
    console.error("Enhanced AI response error:", error);
    return null;
  }
}

function getSystemPromptForRole(role: string | null): string {
  switch (role) {
    case 'therapist':
      return THERAPIST_BOT_ENHANCED_PROMPT;
    case 'patient':
    default:
      return `You are MindCare's AI wellness coach. You provide supportive, empathetic responses to help patients with their mental health concerns. 

IMPORTANT: You must ALWAYS respond with valid JSON in this exact format:
{
  "response": "Your helpful, empathetic message here",
  "responseType": "supportive",
  "emotionalTone": "empathetic", 
  "confidenceScore": 0.85,
  "escalationRequired": false,
  "flagsForTherapist": null,
  "suggestedFollowUp": null
}

Keep your response warm, supportive, and helpful. Focus on the user's immediate needs while being encouraging.`;
  }
}

function buildContextualPrompt(context: IAIContext, userMessage: string): string {
  const { userProfile, conversationHistory, therapeuticContext, sessionMetadata } = context;
  
  // Build conversation history string (limit to recent messages to avoid token limits)
  const historyString = conversationHistory
    .slice(-5) // Last 5 messages only
    .map(msg => `${msg.senderRole}: ${msg.message}`)
    .join('\n');

  // Build mood context if available
  const moodContext = therapeuticContext.recentMoodEntries
    ? therapeuticContext.recentMoodEntries
        .slice(-3) // Last 3 mood entries only
        .map(mood => `Mood: ${mood.moodLevel}/10 - Tags: ${mood.tags.join(', ')}`)
        .join('\n')
    : 'No recent mood data';

  const prompt = `
PATIENT INFO:
- Name: ${userProfile.name}
- Current Risk Level: ${userProfile.currentRiskLevel || 'Unknown'}
- Recent Mood Trend: ${userProfile.recentMoodTrend || 'Unknown'}/10

RECENT CONVERSATION:
${historyString || 'No previous conversation'}

RECENT MOOD DATA:
${moodContext}

TIME CONTEXT:
- Time of Day: ${sessionMetadata.timeOfDay}
- Emergency Hours: ${sessionMetadata.isEmergencyHours ? 'Yes' : 'No'}

USER'S CURRENT MESSAGE:
"${userMessage}"

Please provide a supportive response in the required JSON format. Be empathetic and helpful.
  `;

  return prompt;
}

function getJsonFromAIResponse(text: string): any | null {
  if (!text) {
    console.error("Empty AI response text");
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      
      if (start === -1 || end === 0) {
        console.error("No JSON braces found in AI response");
        
        // Try to create a valid JSON response from plain text
        const fallbackResponse = {
          response: text.trim(),
          responseType: "supportive",
          emotionalTone: "empathetic",
          confidenceScore: 0.7,
          escalationRequired: false,
          flagsForTherapist: null,
          suggestedFollowUp: null
        };
        
        return fallbackResponse;
      }
      
      const jsonText = text.slice(start, end);
      
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (e2) {
      console.error("Failed to parse extracted JSON:", e2);
      
      // Last resort: create a response from the text
      const lastResortResponse = {
        response: text.trim() || "I'm here to help you. Could you please share more about how you're feeling?",
        responseType: "supportive",
        emotionalTone: "empathetic", 
        confidenceScore: 0.5,
        escalationRequired: false,
        flagsForTherapist: null,
        suggestedFollowUp: null
      };
      
      return lastResortResponse;
    }
  }
}