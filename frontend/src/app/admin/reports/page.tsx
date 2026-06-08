export default function AdminReportsPage() {
  const reports = [
    "Attendance Reports",
    "Fees Reports",
    "Student Performance Reports",
    "Teacher Performance Reports",
    "Revenue Reports",
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Reports & Analytics</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report} className="rounded-2xl border border-default bg-card p-6">
            <h4 className="font-semibold">{report}</h4>
            <p className="mt-2 text-sm text-muted">Generate and export as PDF or Excel</p>
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">PDF</button>
              <button className="rounded-lg border border-default px-4 py-2 text-xs font-medium text-foreground">Excel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}