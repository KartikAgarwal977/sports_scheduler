function formatDate(date) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  }
  
  module.exports = { formatDate };