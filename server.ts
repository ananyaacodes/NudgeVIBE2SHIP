import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Read Firebase config from project root
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
} else {
  console.error('firebase-applet-config.json not found!');
}

// Initialize Firebase
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(firebaseApp);

// Initialize Gemini SDK with User-Agent telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Get tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Missing x-user-id header' });
    }

    const tasksCol = collection(db, 'tasks');
    const q = query(
      tasksCol, 
      where('userId', '==', userId),
      orderBy('due_date', 'asc')
    );
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Missing x-user-id header' });
    }

    const { title, due_date, priority, category } = req.body;
    if (!title || !due_date) {
      return res.status(400).json({ error: 'title and due_date are required' });
    }

    const newTask = {
      title,
      due_date,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'pending',
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Missing x-user-id header' });
    }

    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date().toISOString();

    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, updates);
    res.json({ id, ...updates });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Missing x-user-id header' });
    }

    const { id } = req.params;
    const taskRef = doc(db, 'tasks', id);
    await deleteDoc(taskRef);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

// TOOL IMPLEMENTATIONS FOR GEMINI
async function addTaskInternal(userId: string, args: any) {
  console.log('[add_task tool] Called with args:', args);
  const { title, due_date, priority, category } = args;
  
  const newTask = {
    title,
    due_date,
    priority: priority || 'medium',
    category: category || 'general',
    status: 'pending',
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'tasks'), newTask);
  return {
    success: true,
    taskId: docRef.id,
    task: newTask,
    message: `Task "${title}" added successfully.`
  };
}

async function getPrioritiesInternal(userId: string, args: any) {
  console.log('[get_priorities tool] Called with args:', args);
  const limitCount = args.limit || 5;

  const tasksCol = collection(db, 'tasks');
  const q = query(
    tasksCol,
    where('userId', '==', userId),
    where('status', '!=', 'completed')
  );

  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  // Rank priority values
  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };

  // Sort by urgency (due_date ascending) and priority weight descending
  const sortedTasks = tasks.sort((a, b) => {
    const timeA = new Date(a.due_date).getTime();
    const timeB = new Date(b.due_date).getTime();

    if (Math.abs(timeA - timeB) < 60 * 60 * 1000) {
      // If within 1 hour, sort by priority
      const pA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const pB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      return pB - pA;
    }
    return timeA - timeB;
  });

  return {
    tasks: sortedTasks.slice(0, limitCount)
  };
}

async function suggestScheduleInternal(userId: string, accessToken: string | undefined, args: any) {
  console.log('[suggest_schedule tool] Called with args:', args);
  const { date, available_hours } = args;

  // 1. Get pending tasks
  const { tasks } = await getPrioritiesInternal(userId, { limit: 10 });

  // 2. Query Google Calendar if accessToken is present
  let calendarEvents: any[] = [];
  if (accessToken) {
    try {
      const startOfDay = `${date}T00:00:00Z`;
      const endOfDay = `${date}T23:59:59Z`;
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          calendarEvents = data.items.map((item: any) => ({
            id: item.id,
            summary: item.summary || 'Busy',
            start: item.start?.dateTime || item.start?.date,
            end: item.end?.dateTime || item.end?.date,
          }));
        }
      } else {
        console.warn('Google Calendar API returned status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching from Google Calendar:', err);
    }
  }

  // 3. Simple scheduler logic
  // Parse work hours (default 9 AM to 6 PM)
  let startHour = 9;
  let endHour = 18;
  if (available_hours) {
    // Basic heuristics to parse hours (e.g. "9am-5pm" or "10-18")
    const match = available_hours.toLowerCase().match(/(\d+)\s*(am|pm)?\s*-\s*(\d+)\s*(am|pm)?/);
    if (match) {
      let h1 = parseInt(match[1]);
      const ampm1 = match[2];
      let h2 = parseInt(match[3]);
      const ampm2 = match[4];

      if (ampm1 === 'pm' && h1 < 12) h1 += 12;
      if (ampm1 === 'am' && h1 === 12) h1 = 0;
      if (ampm2 === 'pm' && h2 < 12) h2 += 12;
      if (ampm2 === 'am' && h2 === 12) h2 = 0;

      startHour = h1;
      endHour = h2;
    }
  }

  // Create hourly slots
  const slots: any[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const slotStartStr = `${hour.toString().padStart(2, '0')}:00`;
    const slotEndStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
    const slotTimeLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

    // Check calendar overlaps
    const slotStartTime = new Date(`${date}T${slotStartStr}:00`).getTime();
    const slotEndTime = new Date(`${date}T${slotEndStr}:00`).getTime();

    const overlappingEvent = calendarEvents.find(evt => {
      const evtStart = new Date(evt.start).getTime();
      const evtEnd = new Date(evt.end).getTime();
      return (evtStart < slotEndTime && evtEnd > slotStartTime);
    });

    if (overlappingEvent) {
      slots.push({
        time: `${slotTimeLabel} - ${(hour + 1) > 12 ? (hour + 1) - 12 : (hour + 1)}:00 ${(hour + 1) >= 12 ? 'PM' : 'AM'}`,
        activity: `Busy: ${overlappingEvent.summary}`,
        type: 'calendar_event'
      });
    } else {
      slots.push({
        time: `${slotTimeLabel} - ${(hour + 1) > 12 ? (hour + 1) - 12 : (hour + 1)}:00 ${(hour + 1) >= 12 ? 'PM' : 'AM'}`,
        activity: 'Open',
        type: 'free'
      });
    }
  }

  // Distribute tasks to free slots
  let taskIndex = 0;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].type === 'free' && taskIndex < tasks.length) {
      slots[i].activity = `Focus: ${tasks[taskIndex].title} (${tasks[taskIndex].priority} priority)`;
      slots[i].type = 'task';
      taskIndex++;
    } else if (slots[i].type === 'free') {
      slots[i].activity = 'Buffer / Task catch-up';
    }
  }

  return {
    date,
    calendarEventsCount: calendarEvents.length,
    calendarEvents,
    suggested_slots: slots,
    message: `Generated schedule for ${date} with ${calendarEvents.length} calendar events and ${Math.min(taskIndex, tasks.length)} focus blocks.`
  };
}

// AI Companion: Nudge Exact Prompt and Function declarations
const Nudge_systemInstruction = `You are Nudge, a proactive AI productivity companion. Your job is to help the user actually finish tasks before deadlines, not just remind them.

Core behaviors:
- When the user mentions a task, deadline, assignment, bill, interview, or commitment, capture it immediately by calling add_task. Don't ask permission first — capture it, then confirm in one short sentence.
- When the user opens a session or asks what to focus on, call get_priorities to see their current task list ranked by urgency before responding.
- When the user has multiple competing deadlines, call suggest_schedule to produce a concrete time-blocked plan rather than giving vague advice like "just prioritize."
- If a deadline is less than 24 hours away and the task isn't marked in-progress, proactively flag it and offer to re-plan the user's day — don't wait to be asked.
- Be direct and action-oriented. After logging or discussing a task, always ask what the next concrete action is and when the user will do it.
- Keep responses short — 2-4 sentences. You are a doer, not a lecturer.`;

const toolsList = [
  {
    name: 'add_task',
    description: 'Add a new task or deadline the user mentioned to their task list.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short description of the task'
        },
        due_date: {
          type: 'string',
          description: 'ISO 8601 date or datetime the task is due, e.g. 2026-06-27T18:00:00'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Initial priority level'
        },
        category: {
          type: 'string',
          description: 'e.g. assignment, bill, meeting, interview'
        }
      },
      required: ['title', 'due_date']
    }
  },
  {
    name: 'get_priorities',
    description: "Retrieve the user's current tasks ranked by urgency and importance, to decide what they should focus on next.",
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max number of tasks to return, defaults to 5'
        }
      }
    }
  },
  {
    name: 'suggest_schedule',
    description: "Generate a concrete time-blocked schedule for the user's pending tasks for a given day, factoring in their existing calendar events.",
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'ISO 8601 date to schedule for, e.g. 2026-06-25'
        },
        available_hours: {
          type: 'string',
          description: "Optional free-text on the user's available hours, e.g. '9am-9pm except 1-2pm'"
        }
      },
      required: ['date']
    }
  }
];

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const authHeader = req.headers['authorization'] as string;
    const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Missing x-user-id header' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Format messages for @google/genai SDK
    // The chat history format: Array of { role: 'user'|'model', parts: [{ text: '...' } | { functionCall: ... } | { functionResponse: ... }] }
    const contents: any[] = [];
    
    for (const msg of messages) {
      contents.push({
        role: msg.role,
        parts: msg.parts.map((p: any) => {
          if (p.text) return { text: p.text };
          if (p.functionCall) return { functionCall: p.functionCall };
          if (p.functionResponse) return { functionResponse: p.functionResponse };
          return p;
        })
      });
    }

    console.log('[API Chat] Sending contents to Gemini...');

    // Function Execution Loop
    let actionsTaken: any[] = [];
    let loopCount = 0;
    const maxLoops = 5;
    let finalResponseText = '';

    while (loopCount < maxLoops) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: Nudge_systemInstruction,
          tools: [{ functionDeclarations: toolsList as any }]
        }
      });

      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;
      const parts = modelContent?.parts || [];

      // Append what the model returned to our history
      if (modelContent) {
        contents.push(modelContent);
      }

      // Check for function calls
      const functionCalls = parts.filter((p: any) => p.functionCall);

      if (functionCalls.length > 0) {
        console.log(`[API Chat] Model requested ${functionCalls.length} function call(s)`);
        const responseParts: any[] = [];

        for (const part of functionCalls) {
          const call = part.functionCall;
          let result: any = null;

          try {
            if (call.name === 'add_task') {
              result = await addTaskInternal(userId, call.args);
              actionsTaken.push({ action: 'add_task', args: call.args, result });
            } else if (call.name === 'get_priorities') {
              result = await getPrioritiesInternal(userId, call.args);
              actionsTaken.push({ action: 'get_priorities', args: call.args, result });
            } else if (call.name === 'suggest_schedule') {
              result = await suggestScheduleInternal(userId, accessToken, call.args);
              actionsTaken.push({ action: 'suggest_schedule', args: call.args, result });
            } else {
              result = { error: `Function ${call.name} is not supported` };
            }
          } catch (err: any) {
            console.error(`Error executing tool ${call.name}:`, err);
            result = { error: err.message };
          }

          responseParts.push({
            functionResponse: {
              name: call.name,
              response: result
            }
          });
        }

        // Append tool responses to the model's query
        contents.push({
          role: 'user', // In @google/genai tool/user role contains functionResponse parts
          parts: responseParts
        });

        loopCount++;
      } else {
        // No function calls, this is the final text answer!
        finalResponseText = parts.find((p: any) => p.text)?.text || '';
        break;
      }
    }

    res.json({
      text: finalResponseText,
      actionsTaken,
      updatedHistory: contents
    });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve UI / Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Last-Minute Life Saver] Server listening on http://localhost:${PORT}`);
  });
}

startServer();
