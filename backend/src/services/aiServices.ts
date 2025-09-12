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

    // Await and parse the JSON content of the response
    if (!response.ok) return null;
    const jsonResponse = await response.json();
    const requiredJson = jsonResponse?.choices[0]?.message?.content;
    
    return getJsonFromAIResponse(requiredJson);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", e);
    return null;
  }
}

export async function getEnhancedAIResponse(context: IAIContext, userMessage: string): Promise<IAIResponse | null> {
  try {
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
            "content": context.systemPrompt
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
      console.error("AI API error:", response.status, response.statusText);
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
    if (!parsedResponse || typeof parsedResponse.response !== 'string') {
      console.error("Invalid AI response structure");
      return null;
    }

    return parsedResponse;

  } catch (error) {
    console.error("Enhanced AI response error:", error);
    return null;
  }
}

function buildContextualPrompt(context: IAIContext, userMessage: string): string {
  const { userProfile, conversationHistory, therapeuticContext, sessionMetadata } = context;
  
  // Build conversation history string
  const historyString = conversationHistory
    .slice(-10) // Last 10 messages
    .map(msg => `[${msg.timestamp.toISOString()}] ${msg.senderRole}: ${msg.message}`)
    .join('\n');

  // Build mood context if available
  const moodContext = therapeuticContext.recentMoodEntries
    ? therapeuticContext.recentMoodEntries
        .slice(-5) // Last 5 mood entries
        .map(mood => `Mood: ${mood.moodLevel}/10 (${mood.timestamp.toISOString()}) - Tags: ${mood.tags.join(', ')}`)
        .join('\n')
    : 'No recent mood data available';

  const prompt = `
PATIENT CONTEXT:
- Name: ${userProfile.name}
- Role: ${userProfile.role}
- Recent Mood Trend: ${userProfile.recentMoodTrend || 'Unknown'}/10
- Risk Level: ${userProfile.currentRiskLevel || 'Unknown'}
- Communication Style: ${userProfile.preferredCommunicationStyle || 'Not specified'}
- Therapeutic Goals: ${userProfile.therapeuticGoals?.join(', ') || 'Not specified'}

RECENT CONVERSATION HISTORY:
${historyString || 'No previous conversation'}

MOOD CONTEXT (Last 7 days):
${moodContext}

THERAPEUTIC CONTEXT:
- Treatment Phase: ${therapeuticContext.treatmentPhase || 'Unknown'}
- Last Therapy Session: ${therapeuticContext.lastTherapySession?.toISOString() || 'Unknown'}
- Upcoming Appointments: ${therapeuticContext.upcomingAppointments?.length || 0} scheduled

SESSION METADATA:
- Time of Day: ${sessionMetadata.timeOfDay}
- Day of Week: ${sessionMetadata.dayOfWeek}
- Emergency Hours: ${sessionMetadata.isEmergencyHours ? 'Yes' : 'No'}
- Conversation Duration: ${sessionMetadata.conversationDuration} minutes
- Message Count: ${sessionMetadata.messageCount}

CURRENT MESSAGE FROM USER:
"${userMessage}"

Please analyze this context and provide an appropriate response following the guidelines in your system prompt.
  `;

  return prompt;
}

function getJsonFromAIResponse(text: string): any | null {
  try {
    // First try to parse the entire text as JSON
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to extract JSON from between curly braces
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      
      if (start === -1 || end === 0) {
        console.error("No JSON found in AI response");
        return null;
      }
      
      const jsonText = text.slice(start, end);
      return JSON.parse(jsonText);
    } catch (e2) {
      console.error("Failed to parse AI response as JSON:", e2);
      return null;
    }
  }
}