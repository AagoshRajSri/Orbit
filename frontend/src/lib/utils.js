export function formatTime(dateString) {
  if (!dateString) return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatMessageDate(dateString) {
  if (!dateString) return "Today";
  
  const date = new Date(dateString);
  const today = new Date();
  
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = normalizedToday - normalizedDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  
  const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const day = date.getDate();
  const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                 (day % 10 === 2 && day !== 12) ? 'nd' :
                 (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
                 
  const parts = formatter.formatToParts(date);
  const month = parts.find(p => p.type === 'month').value;
  const year = parts.find(p => p.type === 'year').value;
  
  return `${day}${suffix} ${month}, ${year}`;
}
