// Export utilities for downloading questions data

export const exportToCSV = (questions) => {
  // CSV Headers
  const headers = ['Timestamp', 'Author', 'Question', 'Status', 'Submitted At'];
  
  // Convert questions to CSV rows
  const rows = questions.map(q => [
    new Date(q.timestamp).toLocaleString(),
    q.author,
    `"${q.question.replace(/"/g, '""')}"`, // Escape quotes
    q.answered ? 'Answered' : 'Unanswered',
    q.createdAt ? new Date(q.createdAt).toLocaleString() : 'N/A'
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and download file
  downloadFile(csvContent, 'questions-export.csv', 'text/csv');
};

export const exportToJSON = (questions) => {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalQuestions: questions.length,
    answeredCount: questions.filter(q => q.answered).length,
    unansweredCount: questions.filter(q => !q.answered).length,
    questions: questions.map(q => ({
      id: q.id,
      timestamp: q.timestamp,
      author: q.author,
      question: q.question,
      answered: q.answered,
      createdAt: q.createdAt
    }))
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, 'questions-export.json', 'application/json');
};

export const exportToText = (questions) => {
  const textContent = questions.map((q, index) => {
    return `
Question ${index + 1}
-----------------
From: ${q.author}
Time: ${new Date(q.timestamp).toLocaleString()}
Status: ${q.answered ? 'Answered' : 'Unanswered'}

${q.question}

`.trim();
  }).join('\n\n' + '='.repeat(50) + '\n\n');
  
  const header = `Beyond the Vibes - Questions Export
Generated: ${new Date().toLocaleString()}
Total Questions: ${questions.length}
${'='.repeat(50)}\n\n`;
  
  downloadFile(header + textContent, 'questions-export.txt', 'text/plain');
};

// Helper function to trigger file download
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export analytics summary
export const generateAnalytics = (questions) => {
  const total = questions.length;
  const answered = questions.filter(q => q.answered).length;
  const unanswered = total - answered;
  const anonymous = questions.filter(q => q.author === 'Anonymous').length;
  
  // Time analysis
  const timestamps = questions.map(q => new Date(q.timestamp).getTime());
  const firstQuestion = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
  const lastQuestion = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
  
  // Top authors (non-anonymous)
  const authorCounts = {};
  questions.forEach(q => {
    if (q.author !== 'Anonymous') {
      authorCounts[q.author] = (authorCounts[q.author] || 0) + 1;
    }
  });
  
  const topAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author, count]) => ({ author, count }));
  
  return {
    summary: {
      total,
      answered,
      unanswered,
      anonymous,
      percentAnswered: total > 0 ? ((answered / total) * 100).toFixed(1) : 0,
      percentAnonymous: total > 0 ? ((anonymous / total) * 100).toFixed(1) : 0
    },
    timeline: {
      firstQuestion: firstQuestion ? firstQuestion.toLocaleString() : 'N/A',
      lastQuestion: lastQuestion ? lastQuestion.toLocaleString() : 'N/A',
      duration: firstQuestion && lastQuestion 
        ? `${Math.round((lastQuestion - firstQuestion) / 60000)} minutes`
        : 'N/A'
    },
    topAuthors
  };
};