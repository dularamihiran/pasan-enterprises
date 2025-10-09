// Test script to verify current month is 12th position
const fetch = require('node-fetch');

async function testCurrentMonthPosition() {
  try {
    console.log('=== CURRENT MONTH POSITION TEST ===\n');
    
    const today = new Date();
    const currentMonth = today.toLocaleString('en-US', { month: 'short' });
    const currentYear = today.getFullYear();
    
    console.log(`Today's Date: ${today.toDateString()}`);
    console.log(`Current Month: ${currentMonth} ${currentYear}`);
    console.log('Expected: Current month should be in position 12 (last bar)\n');
    
    const response = await fetch('http://localhost:5000/api/dashboard/monthly-graph');
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('📊 MONTH ORDER VERIFICATION:');
      console.log('Total months returned:', data.data.length);
      console.log('');
      
      data.data.forEach((month, index) => {
        const position = index + 1;
        const isCurrentFlag = month.isCurrentMonth ? ' ✓ CURRENT' : '';
        const isLastPosition = position === 12 ? ' (12th position)' : '';
        
        console.log(`${position.toString().padStart(2)}. ${month.month} ${month.year}: LKR ${month.revenue.toLocaleString()}${isCurrentFlag}${isLastPosition}`);
      });
      
      // Verify current month is in position 12
      const lastMonth = data.data[data.data.length - 1];
      const isCorrectPosition = lastMonth.month === currentMonth && lastMonth.year === currentYear;
      
      console.log('\n🔍 VERIFICATION RESULTS:');
      console.log(`Last position (12th) month: ${lastMonth.month} ${lastMonth.year}`);
      console.log(`Expected current month: ${currentMonth} ${currentYear}`);
      console.log(`✅ Correct positioning: ${isCorrectPosition ? 'YES' : 'NO'}`);
      
      if (lastMonth.isCurrentMonth) {
        console.log('✅ Current month flag: SET');
      } else {
        console.log('❌ Current month flag: NOT SET');
      }
      
      // Show the progression
      console.log('\n📅 MONTH PROGRESSION:');
      const startMonth = data.data[0];
      const endMonth = data.data[data.data.length - 1];
      console.log(`From: ${startMonth.month} ${startMonth.year} (11 months ago)`);
      console.log(`To: ${endMonth.month} ${endMonth.year} (current month)`);
      
      // Check for any duplicate months (debugging)
      const monthYearStrings = data.data.map(m => `${m.month} ${m.year}`);
      const duplicates = monthYearStrings.filter((item, index) => monthYearStrings.indexOf(item) !== index);
      
      if (duplicates.length > 0) {
        console.log('\n⚠️ WARNING: Duplicate months found:', duplicates);
      } else {
        console.log('\n✅ No duplicate months found');
      }
      
    } else {
      console.log('❌ Failed to get monthly graph data');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing month position:', error.message);
  }
}

testCurrentMonthPosition();