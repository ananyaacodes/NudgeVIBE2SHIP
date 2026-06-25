export interface Task {
  id?: string;
  title: string;
  due_date: string; // ISO string
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  status: 'pending' | 'in-progress' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>;
  createdAt: string;
  // Metadata for display
  isSystem?: boolean;
  audioUrl?: string; // Base64 or Blob URL of voice message
  duration?: string; // Voice recording duration
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}
