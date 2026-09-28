function StatusBadge({ status }) {
  const formatted = status
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span className={`status-badge status-${status}`}>
      {formatted}
    </span>
  );
}

export default StatusBadge;