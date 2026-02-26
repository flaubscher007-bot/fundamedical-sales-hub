export default function BULDashboard() {
  return (
    <div className="fixed inset-0 top-16 flex flex-col">
      <iframe
        title="KAC Tracker"
        width="100%"
        height="100%"
        src="https://app.powerbi.com/view?r=eyJrIjoiZDRlYzliNTMtNzc4My00ZmRmLThmYjktYmU2MDg4NGVjMzkzIiwidCI6ImViNzdjYzEwLTc5NDAtNDhjMy1hMDMzLWJkZjU3ODIzNDk0YiJ9&pageName=ebef07879a4406f00591"
        frameBorder="0"
        allowFullScreen={true}
      />
    </div>
  );
}