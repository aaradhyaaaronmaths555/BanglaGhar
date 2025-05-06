import mongoose from 'mongoose';
import Property from '../models/property.js';
import geocoder from '../utils/geocoder.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const batchSize = 10; // Process in small batches to avoid rate limits
const delay = 1000; // Add delay between geocoding requests (in ms)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const geocodeProperties = async () => {
  try {
    // Get all properties without position data
    const properties = await Property.find({
      $or: [
        { position: { $exists: false } },
        { position: null },
        { 'position.lat': { $exists: false } },
        { 'position.lng': { $exists: false } }
      ]
    });
    
    console.log(`Found ${properties.length} properties without coordinates`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process properties in batches
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(properties.length/batchSize)}`);
      
      // Process each property in the batch
      const promises = batch.map(async (property) => {
        try {
          // Construct address string
          const addressString = [
            property.addressLine1,
            property.addressLine2,
            property.cityTown,
            property.district,
            'Bangladesh'
          ].filter(Boolean).join(', ');
          
          console.log(`Geocoding: ${addressString}`);
          
          // Geocode the address
          const geocodeResults = await geocoder.geocode(addressString);
          
          if (geocodeResults && geocodeResults.length > 0) {
            // Update the property with coordinates
            property.position = {
              lat: geocodeResults[0].latitude,
              lng: geocodeResults[0].longitude
            };
            
            await property.save();
            console.log(`✅ Updated property ${property._id} with coordinates: ${JSON.stringify(property.position)}`);
            successCount++;
          } else {
            console.warn(`❌ No geocoding results for: ${addressString}`);
            failCount++;
          }
        } catch (error) {
          console.error(`❌ Error geocoding property ${property._id}:`, error);
          failCount++;
        }
        
        // Add small delay to avoid hitting rate limits
        await sleep(delay);
      });
      
      // Wait for batch to complete
      await Promise.all(promises);
    }
    
    console.log(`Geocoding completed. Success: ${successCount}, Failed: ${failCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
};

// Execute the function
geocodeProperties();