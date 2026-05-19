import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function RootCauseCluster() {
  return (
    <AiToolPage
      title="Root-Cause Cluster"
      intro="Identify systemic root causes across recently triaged complaints."
      endpoint="root-cause-cluster"
      fields={[
        { name: 'period', label: 'Period', type: 'text', default: '30 days' },
      ]}
    />
  );
}
