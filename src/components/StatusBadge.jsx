export function StatusBadge({ status }) {
  const statusColors = {
    active: 'green',
    inactive: 'gray',
    pending: 'yellow',
  };
  return <span style={{ color: statusColors[status] }}>{status}</span>;
}
