export const formatDate = (date: Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // +1 필수
  const day = String(d.getDate()).padStart(2, '0');

  const formatted = `${year}-${month}-${day}`;
  return formatted;
};
