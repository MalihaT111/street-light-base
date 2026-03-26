function ReportCard({ report, onEdit, onDelete }) {
  return (
    <div className="report-card">
      <div className="report-card-top">
        <h3 className="report-card-title">{report.title}</h3>
        <span className={`report-condition ${report.condition.toLowerCase()}`}>
          {report.condition}
        </span>
      </div>

      <p className="report-card-borough">{report.borough}</p>
      <p className="report-card-description">{report.description}</p>
      <p className="report-card-date">{report.date}</p>

      <div className="report-card-actions">
        <button
          className="edit-button"
          onClick={() => onEdit(report)}
        >
          Edit
        </button>
        <button
          className="delete-button"
          onClick={() => onDelete(report.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default ReportCard;