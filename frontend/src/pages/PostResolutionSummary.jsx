import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function PostResolutionSummary() {
  return (
    <AiToolPage
      title="Post-Resolution Summary"
      intro="Extract reusable lessons and a knowledge-base entry from a resolved case."
      endpoint="post-resolution-summary"
      fields={[
        { name: 'caseId', label: 'Case ID', type: 'text' },
        { name: 'finalOutcome', label: 'Final outcome', type: 'textarea' },
        { name: 'customerFeedback', label: 'Customer feedback', type: 'textarea' },
        { name: 'durationDays', label: 'Duration (days)', type: 'number' },
      ]}
    />
  );
}
