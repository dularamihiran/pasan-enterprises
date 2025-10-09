// Test script to verify correct month calculation for October 2025
const fetch = require('node-fetch');

async function testOctoberMonths() {
  try {
    console.log('=== OCTOBER 2025 MONTH VERIFICATION ===\n');
    
    const today = new Date('2025-10-10'); // Simulating October 10, 2025
    const currentMonth = today.getMonth(); // 9 (October)
    const currentYear = today.getFullYear(); // 2025
    
    console.log(`Current Date: ${today.toDateString()}`);
    console.log(`Current Month Index: ${currentMonth} (October)`);
    console.log(`Current Year: ${currentYear}\n`);
    
    // Calculate what the 12 months should be
    console.log('📅 EXPECTED 12 MONTHS (ending with October 2025):');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 11; i >= 0; i--) {
      let targetYear = currentYear;
      let targetMonth = currentMonth - i;
      
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      
      const position = 12 - i;
      const isCurrent = (targetMonth === currentMonth && targetYear === currentYear);
      const marker = isCurrent ? ' ← CURRENT' : '';
      
      console.log(`${position.toString().padStart(2)}. ${monthNames[targetMonth]} ${targetYear}${marker}`);
    }
    
    console.log('\n✅ Expected Result:');
    console.log('- November 2024 through October 2025 (12 months)');
    console.log('- No November 2025 or December 2025');
    console.log('- October 2025 is the 12th (last) month');
    
    // Test actual API
    console.log('\n🔍 TESTING ACTUAL API...');
    const response = await fetch('http://localhost:5000/api/dashboard/monthly-graph');
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('\n📊 ACTUAL API RESPONSE:');
      data.data.forEach((month, index) => {
        const position = index + 1;
        const currentFlag = month.isCurrentMonth ? ' ← CURRENT' : '';
        console.log(`${position.toString().padStart(2)}. ${month.month} ${month.year}${currentFlag}`);
      });
      
      // Verification
      const hasNov2025 = data.data.some(m => m.month === 'Nov' && m.year === 2025);
      const hasDec2025 = data.data.some(m => m.month === 'Dec' && m.year === 2025);
      const lastMonth = data.data[data.data.length - 1];
      const isOctLast = lastMonth.month === 'Oct' && lastMonth.year === 2025;
      
      console.log('\n✅ VERIFICATION:');
      console.log(`No November 2025: ${!hasNov2025 ? 'PASS' : 'FAIL'}`);
      console.log(`No December 2025: ${!hasDec2025 ? 'PASS' : 'FAIL'}`);
      console.log(`October 2025 is last: ${isOctLast ? 'PASS' : 'FAIL'}`);
      console.log(`Total months: ${data.data.length} (should be 12)`);
      
    } else {
      console.log('❌ Failed to get API response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOctoberMonths();