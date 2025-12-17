// Simple runner script
import('./fetch-missing-requirements.js').catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


