function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  type = "default",
}) {
  return (
    <div className="stat-card">

      <div className="stat-header">
        <div className={`stat-icon ${type}`}>
          <Icon size={20} />
        </div>

        <span>{title}</span>
      </div>

      <h2>{value}</h2>

      <p>{subtitle}</p>

    </div>
  );
}

export default StatCard;