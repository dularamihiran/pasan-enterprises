// Visual example of the month ordering (assuming current date is October 10, 2025)

console.log('=== MONTH ORDERING EXAMPLE ===');
console.log('Current Date: October 10, 2025');
console.log('Current Month: October 2025\n');

console.log('Chart will show 12 months in this order:');
console.log('Position | Month-Year    | Description');
console.log('---------|---------------|------------------');
console.log('1st      | Nov 2024      | 11 months ago');
console.log('2nd      | Dec 2024      | 10 months ago');
console.log('3rd      | Jan 2025      | 9 months ago');
console.log('4th      | Feb 2025      | 8 months ago');
console.log('5th      | Mar 2025      | 7 months ago');
console.log('6th      | Apr 2025      | 6 months ago');
console.log('7th      | May 2025      | 5 months ago');
console.log('8th      | Jun 2025      | 4 months ago');
console.log('9th      | Jul 2025      | 3 months ago');
console.log('10th     | Aug 2025      | 2 months ago');
console.log('11th     | Sep 2025      | 1 month ago');
console.log('12th     | Oct 2025      | CURRENT MONTH ← Highlighted');

console.log('\n✅ Current month (October 2025) is in the 12th (last) position');
console.log('✅ Previous 11 months are shown before it');
console.log('✅ Chart spans exactly 12 months ending with current month');

// Show the algorithm
console.log('\n=== ALGORITHM EXPLANATION ===');
console.log('Loop: for (let i = 11; i >= 0; i--)');
console.log('- When i = 11: targetDate = Oct 2025 - 11 months = Nov 2024 (1st bar)');
console.log('- When i = 10: targetDate = Oct 2025 - 10 months = Dec 2024 (2nd bar)');
console.log('- ...');
console.log('- When i = 1:  targetDate = Oct 2025 - 1 month = Sep 2025 (11th bar)');
console.log('- When i = 0:  targetDate = Oct 2025 - 0 months = Oct 2025 (12th bar) ← CURRENT');

module.exports = {};