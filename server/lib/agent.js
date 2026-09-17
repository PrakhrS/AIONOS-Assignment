const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

let kbData = '[]';
let ticketHistoryData = '[]';

try {
  kbData = fs.readFileSync(path.join(__dirname, '..', 'data', 'kb.json'), 'utf8');
  ticketHistoryData = fs.readFileSync(path.join(__dirname, '..', 'data', 'ticketHistory.json'), 'utf8');
} catch (err) {
  console.error("Error loading static data in agent.js:", err);
}

function buildSystemPrompt() {
  return `You are an internal IT support agent for Veridian Corp.

**Behavioral Rules:**
1. You must answer the user's issue based strictly on the Knowledge Base (KB) below.
2. Always cite the KB source ID (e.g., KB-03) in the 'kbSource' field if your answer relies on a KB article.
3. If the user's request is vague (e.g., "it's not working"), ask follow-up questions to gather more details.
4. Classify every issue into a category (e.g. hardware, access, software, account, security, network).
5. Decide on an action:
   - 'resolve': If you have given a solution or the request is fully completed.
   - 'escalate': If the issue requires human intervention or approval.
   - 'ask_followup': If you need more information.
   - 'info': If you are just providing general information.

**Knowledge Base (KB):**
${kbData}

**Ticket History (Past resolved tickets for context):**
${ticketHistoryData}

You must strictly output a JSON object adhering to the specified responseSchema.`;
}

async function processMessage({ message, employeeName, employeeEmail, conversationHistory = [] }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          reply: { 
            type: SchemaType.STRING, 
            description: 'Natural-language response to the employee' 
          },
          action: { 
            type: SchemaType.STRING, 
            description: 'Enum: resolve, escalate, ask_followup, info' 
          },
          category: { 
            type: SchemaType.STRING, 
            description: 'Issue category, e.g. hardware, access, software, account, security, network' 
          },
          kbSource: { 
            type: SchemaType.STRING, 
            description: 'KB article ID (e.g. KB-03) or empty string if none',
            nullable: true
          },
          escalatedTo: { 
            type: SchemaType.STRING, 
            description: 'Escalation target (e.g. IT Security, Finance, Manager) or empty string',
            nullable: true
          },
          ticketUpdate: { 
            type: SchemaType.STRING, 
            description: 'Brief internal note for audit trail',
            nullable: true
          }
        },
        required: ['reply', 'action', 'category']
      }
    }
  });

  const formattedHistory = conversationHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const userPrompt = `[${employeeName} <${employeeEmail}>]: ${message}`;
  const contents = [...formattedHistory, { role: 'user', parts: [{ text: userPrompt }] }];

  const result = await model.generateContent({ contents });
  const responseText = result.response.text();
  
  try {
    const jsonResponse = JSON.parse(responseText);
    return jsonResponse;
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    throw new Error('Invalid JSON response from model');
  }
}

module.exports = { processMessage };
