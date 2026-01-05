const { connectToMongo, getDb } = require('../database/mongo-connection');

// Clear old messages for users who should only see messages from their registration time
async function cleanupOldMessages() {
  try {
    const db = getDb();
    
    // Get all users with their registration times
    const users = await db.collection('users').find({}).toArray();
    
    let cleanedCount = 0;
    
    for (const user of users) {
      // Remove messages that were saved before user's registration time
      const result = await db.collection('chatmessages').deleteMany({
        userId: user._id,
        timestamp: { $lt: user.createdAt }
      });
      
      cleanedCount += result.deletedCount;
      
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned ${result.deletedCount} old messages for user ${user.username}`);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Total cleaned: ${cleanedCount} old messages`);
    } else {
      console.log(`✅ No old messages to clean`);
    }
    
  } catch (error) {
    console.error('Error cleaning old messages:', error);
  }
}

// Run the cleanup
(async () => {
  try {
    await connectToMongo();
    await cleanupOldMessages();
    console.log('✅ Message cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
})();