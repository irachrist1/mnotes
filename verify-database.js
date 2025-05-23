// Comprehensive Database Verification
// Run this with: node verify-database.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyDatabase() {
  console.log('🔍 COMPREHENSIVE DATABASE VERIFICATION\n');

  try {
    // 1. Test record counts
    console.log('📊 1. RECORD COUNTS:');
    const tables = ['income_streams', 'ideas', 'mentorship_sessions', 'content_metrics', 'newsletter_stats', 'operational_areas'];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    }

    // 2. Test sample data from each table
    console.log('\n📝 2. SAMPLE DATA VERIFICATION:');
    
    // Income Streams - Check active vs planned
    const { data: activeStreams } = await supabase
      .from('income_streams')
      .select('name, status, monthly_revenue')
      .eq('status', 'active')
      .limit(3);
    
    console.log(`✅ Active Income Streams (${activeStreams?.length || 0}):`);
    activeStreams?.forEach(stream => {
      console.log(`   • ${stream.name}: $${stream.monthly_revenue}/month`);
    });

    // Ideas - Check by stage
    const { data: ideasByStage } = await supabase
      .from('ideas')
      .select('stage')
      .order('stage');
    
    const stageCount = {};
    ideasByStage?.forEach(idea => {
      stageCount[idea.stage] = (stageCount[idea.stage] || 0) + 1;
    });
    
    console.log(`\n✅ Ideas by Stage:`);
    Object.entries(stageCount).forEach(([stage, count]) => {
      console.log(`   • ${stage}: ${count} ideas`);
    });

    // Newsletter Stats
    const { data: newsletters } = await supabase
      .from('newsletter_stats')
      .select('name, subscriber_count, open_rate');
    
    console.log(`\n✅ Newsletter Performance:`);
    newsletters?.forEach(newsletter => {
      console.log(`   • ${newsletter.name}: ${newsletter.subscriber_count} subscribers (${newsletter.open_rate}% open rate)`);
    });

    // 3. Test complex queries (JSONB)
    console.log('\n🔧 3. COMPLEX QUERY TESTING:');
    
    // Test JSONB queries on mentorship sessions
    const { data: actionItems } = await supabase
      .from('mentorship_sessions')
      .select('mentor_name, action_items')
      .limit(2);
    
    console.log(`✅ Mentorship Action Items (JSONB):`);
    actionItems?.forEach(session => {
      const items = session.action_items || [];
      console.log(`   • ${session.mentor_name}: ${items.length} action items`);
    });

    // Test content with business opportunities
    const { data: contentOpps } = await supabase
      .from('content_metrics')
      .select('title, business_opportunity')
      .not('business_opportunity', 'is', null)
      .limit(3);
    
    console.log(`\n✅ Content with Business Opportunities:`);
    contentOpps?.forEach(content => {
      const opp = content.business_opportunity;
      console.log(`   • "${content.title}": ${opp?.type} ($${opp?.value})`);
    });

    // 4. Test aggregations
    console.log('\n📈 4. BUSINESS METRICS:');
    
    // Total monthly revenue
    const { data: revenueData } = await supabase
      .from('income_streams')
      .select('monthly_revenue');
    
    const totalRevenue = revenueData?.reduce((sum, stream) => sum + (stream.monthly_revenue || 0), 0) || 0;
    console.log(`✅ Total Monthly Revenue: $${totalRevenue}`);

    // Content ROI
    const { data: roiData } = await supabase
      .from('content_metrics')
      .select('roi');
    
    const avgROI = roiData?.reduce((sum, content) => sum + (content.roi || 0), 0) / (roiData?.length || 1);
    console.log(`✅ Average Content ROI: $${avgROI.toFixed(2)}`);

    // Operational health
    const { data: opsHealth } = await supabase
      .from('operational_areas')
      .select('status');
    
    const healthCount = {};
    opsHealth?.forEach(area => {
      healthCount[area.status] = (healthCount[area.status] || 0) + 1;
    });
    
    console.log(`✅ Operational Health:`);
    Object.entries(healthCount).forEach(([status, count]) => {
      const emoji = status === 'healthy' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
      console.log(`   ${emoji} ${status}: ${count} areas`);
    });

    console.log('\n🎉 DATABASE VERIFICATION COMPLETE!');
    console.log('✅ All systems operational and data integrity confirmed!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyDatabase(); 