import Card from '@/components/Card';

export default function AboutUsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">About Us</h2>
        <p className="mt-2 text-gray-600">Why teams use A11yLens for accessibility scanning.</p>
      </div>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Perks of Using A11yLens</h3>
        <ul className="list-disc space-y-2 pl-5 text-gray-700">
          <li>Automated WCAG issue detection across pages so you can catch problems early.</li>
          <li>Clear severity breakdowns (critical, warning, info) for faster prioritization.</li>
          <li>Actionable fix suggestions and code context to speed up remediation.</li>
          <li>Project collaboration support so teams can share ownership of accessibility quality.</li>
          <li>CSV exports for reporting and tracking accessibility progress over time.</li>
        </ul>
      </Card>
    </div>
  );
}
