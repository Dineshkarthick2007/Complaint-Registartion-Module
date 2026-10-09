import { icons } from './icons.js';
import { auth } from './auth.js';
import { sound } from './sound.js';

const N8N_WEBHOOK_URL = 'https://dineshkarthick122007.app.n8n.cloud/webhook/hostel-complaint-bot';
const N8N_TEST_WEBHOOK_URL = 'https://dineshkarthick122007.app.n8n.cloud/webhook-test/hostel-complaint-bot';
const CHAT_HISTORY_KEY = 'hostel_chatbot_history';
const SESSION_ID_KEY = 'hostel_chatbot_session_id';

class HostelChatbot {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.sessionId = this.getOrCreateSessionId();
    this.messages = this.loadHistory();
  }

  getOrCreateSessionId() {
    let id = localStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse chat history', e);
    }
    return [
      {
        sender: 'bot',
        text: 'Hello! I am your **HostelCare AI Assistant** powered by n8n. I can help you register complaints, check ticket statuses, or answer questions about hostel facilities. How can I assist you today?',
        timestamp: Date.now()
      }
    ];
  }

  saveHistory() {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(this.messages));
    } catch (e) {}
  }

  init() {
    this.renderWidget();
    this.attachEvents();
  }

  renderWidget() {
    // Check if widget already exists
    if (document.getElementById('chatbotContainer')) return;

    const container = document.createElement('div');
    container.id = 'chatbotContainer';
    container.innerHTML = `
      <!-- Floating Launcher Button -->
      <button id="chatbotLauncher" class="chatbot-launcher" aria-label="Open AI Assistant" title="Open Hostel AI Assistant">
        <span class="launcher-icon-open">${icons.bot}</span>
        <span class="launcher-icon-close">${icons.x}</span>
        <span class="chatbot-online-indicator"></span>
      </button>

      <!-- Chatbot Drawer Window -->
      <div id="chatbotWindow" class="chatbot-window">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-brand">
            <div class="chat-bot-avatar">${icons.bot}</div>
            <div class="chat-header-info">
              <span class="chat-header-title">HostelCare AI</span>
              <span class="chat-header-status">
                <span class="status-dot"></span>
                <span>Online • n8n Connected</span>
              </span>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="chat-header-btn" id="btnClearChat" title="Clear Conversation">
              ${icons.refresh}
            </button>
            <button class="chat-header-btn" id="btnCloseChat" title="Minimize">
              ${icons.minus}
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="chat-messages" id="chatMessagesContainer"></div>

        <!-- Input Footer -->
        <div class="chat-footer">
          <form id="chatInputForm" class="chat-input-row">
            <input 
              type="text" 
              id="chatInputField" 
              class="chat-input" 
              placeholder="Ask about complaints, status, facilities..." 
              autocomplete="off"
            />
            <button type="submit" id="chatSendBtn" class="chat-send-btn" title="Send Message">
              ${icons.send}
            </button>
          </form>
          <div class="chat-webhook-badge">
            ${icons.sparkles}
            <span>n8n Webhook Agent Integration</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.renderMessages();
  }

  attachEvents() {
    const launcher = document.getElementById('chatbotLauncher');
    const closeBtn = document.getElementById('btnCloseChat');
    const clearBtn = document.getElementById('btnClearChat');
    const form = document.getElementById('chatInputForm');
    const inputField = document.getElementById('chatInputField');

    launcher?.addEventListener('click', () => this.toggleChat());
    closeBtn?.addEventListener('click', () => this.toggleChat(false));

    clearBtn?.addEventListener('click', () => {
      if (confirm('Clear chat history?')) {
        this.messages = [
          {
            sender: 'bot',
            text: 'Conversation reset. How can I help you today?',
            timestamp: Date.now()
          }
        ];
        this.saveHistory();
        this.renderMessages();
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = inputField.value.trim();
      if (text && !this.isLoading) {
        this.sendMessage(text);
        inputField.value = '';
      }
    });
  }

  toggleChat(forceState) {
    this.isOpen = typeof forceState === 'boolean' ? forceState : !this.isOpen;
    const launcher = document.getElementById('chatbotLauncher');
    const windowEl = document.getElementById('chatbotWindow');

    if (this.isOpen) {
      launcher?.classList.add('active');
      windowEl?.classList.add('active');
      setTimeout(() => {
        document.getElementById('chatInputField')?.focus();
        this.scrollToBottom();
      }, 100);
    } else {
      launcher?.classList.remove('active');
      windowEl?.classList.remove('active');
    }
  }

  renderMessages() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    let html = '';

    this.messages.forEach(msg => {
      const isUser = msg.sender === 'user';
      const formattedTime = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="chat-message ${isUser ? 'user-msg' : 'bot-msg'}">
          <div class="msg-avatar">${isUser ? icons.user : icons.bot}</div>
          <div class="msg-content">
            <div class="msg-bubble">${formatMarkdown(msg.text)}</div>
            <span class="msg-time">${formattedTime}</span>
          </div>
        </div>
      `;
    });

    // If initial greeting, add quick prompt pills
    if (this.messages.length === 1) {
      html += `
        <div class="chat-quick-prompts">
          <button class="quick-prompt-btn" data-prompt="How do I raise an electrical complaint?">
            ${icons.bolt} How do I raise an electrical complaint?
          </button>
          <button class="quick-prompt-btn" data-prompt="What do the 3 ticket statuses mean?">
            ${icons.eye} What do the 3 ticket statuses mean?
          </button>
          <button class="quick-prompt-btn" data-prompt="Who is the Chief Warden and contact info?">
            ${icons.shield} Who is the Chief Warden and contact info?
          </button>
          <button class="quick-prompt-btn" data-prompt="What are the technician inspection timings?">
            ${icons.clock} What are the technician inspection timings?
          </button>
        </div>
      `;
    }

    if (this.isLoading) {
      html += `
        <div class="chat-message bot-msg">
          <div class="msg-avatar">${icons.bot}</div>
          <div class="msg-content">
            <div class="chat-typing-indicator">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    this.scrollToBottom();

    // Attach click handlers to prompt pills
    container.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.currentTarget.dataset.prompt;
        if (prompt) {
          this.sendMessage(prompt);
        }
      });
    });
  }

  scrollToBottom() {
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  async sendMessage(text) {
    const user = auth.getCurrentUser();

    // Append user message
    this.messages.push({
      sender: 'user',
      text: text,
      timestamp: Date.now()
    });

    this.isLoading = true;
    this.saveHistory();
    this.renderMessages();

    // Call n8n Webhook
    try {
      const botResponse = await this.callN8nWebhook(text, user);
      
      this.messages.push({
        sender: 'bot',
        text: botResponse,
        timestamp: Date.now()
      });

      sound.playSuccess();
    } catch (err) {
      console.error('Webhook error:', err);
      // Fallback response with helpful information
      const fallbackResponse = this.generateFallbackResponse(text, user);
      this.messages.push({
        sender: 'bot',
        text: fallbackResponse,
        timestamp: Date.now()
      });
    } finally {
      this.isLoading = false;
      this.saveHistory();
      this.renderMessages();
    }
  }

  async callN8nWebhook(text, user) {
    const payload = {
      message: text,
      chatInput: text,
      query: text,
      sessionId: this.sessionId,
      user: {
        id: user?.id || 'anonymous',
        name: user?.name || 'Guest User',
        role: user?.role || 'student',
        block: user?.block || 'Block A',
        roomNumber: user?.roomNumber || 'N/A'
      },
      timestamp: new Date().toISOString()
    };

    // Try primary production webhook
    let response;
    try {
      response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      // Try test URL fallback if production URL fails
      response = await fetch(N8N_TEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      throw new Error(`n8n webhook returned status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (typeof data === 'string') return data;
      if (Array.isArray(data) && data.length > 0) {
        return data[0].output || data[0].text || data[0].message || data[0].response || JSON.stringify(data[0]);
      }
      return data.output || data.text || data.message || data.response || data.result || JSON.stringify(data);
    } else {
      const textResponse = await response.text();
      return textResponse || 'Received empty response from assistant.';
    }
  }

  generateFallbackResponse(query, user) {
    const q = query.toLowerCase();

    if (q.includes('status') || q.includes('addressed') || q.includes('progress') || q.includes('rectified')) {
      return `### 📋 Ticket Lifecycle & Statuses

1. **Addressed**: The Warden has reviewed your complaint, logged the repair requirement, and scheduled a maintenance visit.
2. **In Progress**: A designated technician (e.g. Electrician, Plumber, Carpenter) is actively working on the fix.
3. **Rectified**: The issue has been completely fixed and verified resolved by hostel authorities.

*All status updates synchronize in real time to your student dashboard!*`;
    }

    if (q.includes('raise') || q.includes('create') || q.includes('complaint') || q.includes('submit')) {
      return `### 🚀 How to Raise a Complaint

1. Click the **"Raise Complaint Ticket"** button on your dashboard.
2. Select the issue category (*Electrical, Plumbing, Carpentry, Wi-Fi, Cleaning, Food, Noise*).
3. Set priority level (*Low, Medium, High, or Urgent*).
4. Provide a clear title and description.
5. Pick your preferred technician inspection timing slot.
6. *(Optional)* Attach a photo proof and click **"Submit Complaint Ticket"**.`;
    }

    if (q.includes('warden') || q.includes('contact') || q.includes('phone') || q.includes('emergency')) {
      return `### 🛡️ Hostel Administration & Warden Contacts

- **Chief Warden**: Dr. K. S. Verma (*chief.warden@campus.edu*)
- **Block B Warden**: Prof. Sunita Rao (*warden.blockb@campus.edu*)
- **Hostel Control Room**: +91 98765 43210 (24/7 Helpline)
- **Medical Emergency**: Campus Health Centre Ext. 108`;
    }

    if (q.includes('timing') || q.includes('time') || q.includes('inspection') || q.includes('visit')) {
      return `### ⏰ Maintenance Inspection Slots

Technicians visit hostel blocks during the following designated hours:
- **Morning Slot**: 9:00 AM – 12:00 PM
- **Afternoon Slot**: 12:00 PM – 3:00 PM
- **Evening Slot**: 3:00 PM – 6:00 PM
- **Emergency / Urgent**: Immediate response within 30 minutes.`;
    }

    return `Thank you for your message regarding: **"${escapeHtml(query)}"**.

Our maintenance team is available for all hostel repairs. You can raise a formal ticket from the dashboard or contact your resident block warden for urgent issues.

*(Note: To connect your custom live n8n workflow, ensure your n8n workflow toggle is switched to **Active** in the n8n Cloud editor).*`;
  }
}

export const chatbot = new HostelChatbot();

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<strong>$1</strong>')
    .replace(/^## (.*$)/gim, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
