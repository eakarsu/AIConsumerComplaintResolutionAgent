import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function EscalationDecision() {
  return (
    <AiToolPage
      title="Escalation Decision"
      intro="Decide escalation path, next owner, and SLA."
      endpoint="escalation-decision"
      fields={[
        { name: 'caseSummary', label: 'Case summary', type: 'textarea', rows: 5 },
        { name: 'attemptedRemedies', label: 'Remedies attempted', type: 'textarea' },
        { name: 'customerThreats', label: 'Customer threats / signals', type: 'textarea' },
        { name: 'mediaRisk', label: 'Media / social risk', type: 'text', default: 'Low' },
      ]}
    />
  );
}
