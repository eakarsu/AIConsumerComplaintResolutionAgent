// Illustrative consumer cases. AIFieldPresets preserves any selected record reference.
const cases = [
  ['Delayed delivery', 'A replacement laptop arrived nine days after the promised date. Support closed the ticket without an update.', 'email', 'Replacement laptop', 'Shipping delay', 1299, 'New York, US'],
  ['Duplicate charge', 'A subscription was charged twice on the same day. The second charge remains after five business days.', 'chat', 'Monthly subscription', 'Billing dispute', 49, 'California, US'],
  ['Defective appliance', 'A new dishwasher stopped draining after two weeks. The technician visit was canceled without notice.', 'phone', 'Dishwasher', 'Product defect', 740, 'Ontario, Canada'],
];

export const nativePresetSamples = cases.map(([label, complaint, channel, product, category, amount, location], index) => ({
  label,
  values: {
    complaintText: complaint, channel, customerTier: ['Standard', 'Premium', 'Standard'][index],
    threadHistory: `Customer reported: ${complaint} Support has not yet confirmed a resolution.`,
    customerName: ['Jordan Lee', 'Morgan Patel', 'Casey Rivera'][index], productInvolved: product,
    policyContext: 'Verify order, payment, and warranty records before promising a refund or replacement.',
    tone: 'Empathetic and clear', complaintCategory: category, orderValue: amount,
    customerLifetimeValue: amount * (index + 1), faultParty: 'Pending investigation',
    repeatIncidence: index === 1 ? 'Yes' : 'No', period: ['Last 30 days', 'Last 90 days', 'Last quarter'][index],
    caseSummary: complaint, attemptedRemedies: 'Support acknowledged the case; no final remedy has been confirmed.',
    customerThreats: index === 1 ? 'Customer is considering a card dispute.' : 'Customer may cancel future purchases.',
    mediaRisk: 'Low', customerHistory: `Customer purchased ${product}; earlier case history requires verification.`,
    currentSentiment: 'Frustrated', complaintCount90d: index === 1 ? 2 : 1, ltv: amount * (index + 1),
    customerLocation: location, productType: product,
    caseContext: `Follow up on ${category.toLowerCase()} after checking source records.`,
    customerMessage: 'Please tell me the current status and the next step for my case.',
    finalOutcome: 'Illustrative outcome: an agent reviewed the records and proposed a follow-up action.',
    customerFeedback: 'Customer asked for a clearer status update.', durationDays: [12, 7, 10][index],
  },
}));
