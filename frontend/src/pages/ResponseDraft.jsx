import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function ResponseDraft() {
  return (
    <AiToolPage
      title="Customer Response Draft"
      intro="Draft three response variants (empathetic / factual / resolution-forward)."
      endpoint="response-draft"
      fields={[
        { name: 'complaintText', label: 'Complaint', type: 'textarea', rows: 5 },
        { name: 'customerName', label: 'Customer name', type: 'text' },
        { name: 'productInvolved', label: 'Product involved', type: 'text' },
        { name: 'policyContext', label: 'Policy context', type: 'textarea' },
        { name: 'tone', label: 'Tone', type: 'text', default: 'Empathetic and solution-oriented' },
      ]}
    />
  );
}
