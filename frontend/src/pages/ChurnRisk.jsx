import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function ChurnRisk() {
  return (
    <AiToolPage
      title="Churn Risk"
      intro="Score churn probability and recommend retention plays."
      endpoint="churn-risk"
      fields={[
        { name: 'customerHistory', label: 'Customer history', type: 'textarea' },
        { name: 'currentSentiment', label: 'Current sentiment', type: 'text' },
        { name: 'complaintCount90d', label: 'Complaint count (90d)', type: 'number' },
        { name: 'ltv', label: 'Lifetime value ($)', type: 'number' },
      ]}
    />
  );
}
