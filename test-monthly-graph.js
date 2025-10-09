// Test script for the updated monthly graph (last 12 months)
const fetch = require('node-fetch');

async function testMonthlyGraph() {
  try {
    console.log('=== MONTHLY GRAPH TEST (Last 12 Months) ===\n');
    
    const response = await fetch('http://localhost:5000/api/dashboard/monthly-graph');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success && data.data) {
      console.log('\n📊 LAST 12 MONTHS DATA:');
      console.log('Number of months returned:', data.data.length);
      console.log('');
      
      data.data.forEach((month, index) => {
        const isCurrent = index === data.data.length - 1;
        const indicator = isCurrent ? ' ← CURRENT MONTH' : '';
        console.log(`${index + 1}. ${month.month} ${month.year}: LKR ${month.revenue.toLocaleString()}${indicator}`);
      });
      
      console.log('\n🔍 ANALYSIS:');
      console.log(`Period: ${data.data[0].month} ${data.data[0].year} to ${data.data[data.data.length - 1].month} ${data.data[data.data.length - 1].year}`);
      
      const totalRevenue = data.data.reduce((sum, month) => sum + month.revenue, 0);
      const maxRevenue = Math.max(...data.data.map(m => m.revenue));
      const avgRevenue = totalRevenue / data.data.length;
      
      console.log(`Total Revenue (12 months): LKR ${totalRevenue.toLocaleString()}`);
      console.log(`Average Monthly: LKR ${avgRevenue.toLocaleString()}`);
      console.log(`Highest Month: LKR ${maxRevenue.toLocaleString()}`);
      
      // Show current vs previous month
      if (data.data.length >= 2) {
        const current = data.data[data.data.length - 1];
        const previous = data.data[data.data.length - 2];
        const change = current.revenue - previous.revenue;
        const changePercent = previous.revenue > 0 ? ((change / previous.revenue) * 100).toFixed(1) : 'N/A';
        
        console.log('\n📈 MONTH-OVER-MONTH:');
        console.log(`Previous: ${previous.month} ${previous.year} - LKR ${previous.revenue.toLocaleString()}`);
        console.log(`Current: ${current.month} ${current.year} - LKR ${current.revenue.toLocaleString()}`);
        console.log(`Change: LKR ${change.toLocaleString()} (${changePercent}%)`);
      }
      
    } else {
      console.log('Failed to get monthly graph data');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing monthly graph:', error.message);
  }
}

testMonthlyGraph();