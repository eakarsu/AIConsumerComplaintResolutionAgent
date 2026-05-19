import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function ComplaintTriage() {
  return (
    <AiToolPage
      title="Complaint Triage"
      intro="Classify a complaint by category, severity, urgency, and team."
      endpoint="complaint-triage"
      fields={[
        { name: 'complaintText', label: 'Complaint text', type: 'textarea', rows: 6 },
        { name: 'channel', label: 'Channel', type: 'text', placeholder: 'email / phone / chat / social' },
        { name: 'customerTier', label: 'Customer tier', type: 'text', default: 'Standard' },
      ]}
    />
  );
}
