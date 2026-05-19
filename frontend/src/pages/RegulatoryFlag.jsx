import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function RegulatoryFlag() {
  return (
    <AiToolPage
      title="Regulatory Flag Detection"
      intro="Flag potential CFPB / FTC / FDA / GDPR / CCPA exposure."
      endpoint="regulatory-flag"
      fields={[
        { name: 'complaintText', label: 'Complaint text', type: 'textarea', rows: 6 },
        { name: 'customerLocation', label: 'Customer location', type: 'text', default: 'US' },
        { name: 'productType', label: 'Product type', type: 'text' },
      ]}
    />
  );
}
