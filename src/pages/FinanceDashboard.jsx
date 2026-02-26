export default function FinanceDashboard() {
  return (
    <div className="fixed inset-0 top-16 flex flex-col">
      <iframe
        title="TEAM FINANCE STATS"
        width="100%"
        height="100%"
        src="https://app.powerbi.com/view?r=eyJrIjoiZTljNDEyMTItNzQ4Ny00MTZmLTk0MmUtNDEyYjUwM2YxN2UxIiwidCI6ImViNzdjYzEwLTc5NDAtNDhjMy1hMDMzLWJkZjU3ODIzNDk0YiJ9&pageName=ReportSection9d871590762418041a6e"
        frameBorder="0"
        allowFullScreen={true}
      />
    </div>
  );
}