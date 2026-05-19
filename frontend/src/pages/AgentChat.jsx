import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function AgentChat() {
  return (
    <AiToolPage
      title="Agent Chat"
      intro="Multi-turn agent response. Reuse the same sessionId to keep history."
      endpoint="agent-chat"
      fields={[
        { name: 'sessionId', label: 'Session ID', type: 'text', placeholder: 'e.g. case-12345' },
        { name: 'caseContext', label: 'Case context', type: 'textarea' },
        { name: 'customerMessage', label: 'Latest customer message', type: 'textarea', rows: 5 },
      ]}
    />
  );
}
