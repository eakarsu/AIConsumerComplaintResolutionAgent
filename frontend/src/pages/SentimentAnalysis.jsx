import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function SentimentAnalysis() {
  return (
    <AiToolPage
      title="Sentiment & Emotion Analysis"
      intro="Score sentiment, dominant emotion, and escalation risk."
      endpoint="sentiment-analysis"
      fields={[
        { name: 'complaintText', label: 'Latest message', type: 'textarea', rows: 5 },
        { name: 'threadHistory', label: 'Thread history', type: 'textarea', rows: 5 },
      ]}
    />
  );
}
