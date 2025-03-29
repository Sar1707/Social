import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Check if Cloudinary credentials are properly set
const checkCloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('⚠️ Missing Cloudinary credentials! Make sure to set these in your .env file:');
    console.error('- CLOUDINARY_CLOUD_NAME');
    console.error('- CLOUDINARY_API_KEY');
    console.error('- CLOUDINARY_API_SECRET');
    return false;
  }
  
  console.log('✅ Cloudinary credentials found:', {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY.substring(0, 4) + '...'
  });
  return true;
};

// Configure Cloudinary with your credentials
let cloudinaryConfigured = false;

try {
  console.log('Configuring Cloudinary with environment variables...');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  
  // Verify configuration is working
  if (checkCloudinaryConfig()) {
    console.log(`Cloudinary configured with cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    // Verify credentials with a ping test (don't wait for the result)
    cloudinary.api.ping((error, result) => {
      if (error) {
        console.error('❌ Cloudinary ping test failed:', error.message);
        cloudinaryConfigured = false;
      } else {
        console.log('✅ Cloudinary ping test successful:', result);
        cloudinaryConfigured = true;
      }
    });
  }
} catch (error) {
  console.error('Failed to configure Cloudinary:', error);
  cloudinaryConfigured = false;
}

// Function to determine resource type based on file extension
const getResourceType = (filePath) => {
  if (!filePath) return 'auto';
  
  const ext = path.extname(filePath).toLowerCase();
  const videoExts = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff'];
  
  if (videoExts.includes(ext)) return 'video';
  if (imageExts.includes(ext)) return 'image';
  
  return 'auto'; // Let Cloudinary decide for other types
};

// Test upload to verify Cloudinary connection
const testCloudinaryConnection = async () => {
  console.log('Testing Cloudinary connection with a sample upload...');
  
  // Small base64 encoded 1x1 pixel transparent image for testing
  const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  try {
    const result = await cloudinary.uploader.upload(testBase64, {
      resource_type: 'image',
      public_id: 'connection_test_' + Date.now(),
      overwrite: true,
      invalidate: true
    });
    
    if (result && result.secure_url) {
      console.log('✅ Cloudinary connection test successful. URL:', result.secure_url);
      cloudinaryConfigured = true;
      
      // Clean up the test image
      try {
        await cloudinary.uploader.destroy(result.public_id);
        console.log('Test image cleanup successful');
      } catch (cleanupError) {
        console.log('Test image cleanup failed:', cleanupError.message);
      }
      
      return true;
    } else {
      console.error('❌ Cloudinary test upload returned an invalid result:', result);
      cloudinaryConfigured = false;
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary connection test failed:', error.message);
    if (error.message.includes('API key')) {
      console.error('🚨 This appears to be an authentication issue. Please check your Cloudinary credentials.');
    }
    cloudinaryConfigured = false;
    return false;
  }
};

// Call the test function immediately
testCloudinaryConnection().then(success => {
  if (success) {
    console.log('Cloudinary is ready for use');
  } else {
    console.error('Cloudinary setup failed. Uploads will not work.');
  }
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.error("No file path provided for cloudinary upload");
            return null;
        }

        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            console.error(`File not found at path: ${localFilePath}`);
            return null;
        }

        // Verify Cloudinary is properly configured before attempting upload
        if (!checkCloudinaryConfig()) {
            console.error('Cloudinary is not properly configured. Upload aborted.');
            return null;
        }

        // If previous ping test failed, try again before giving up
        if (!cloudinaryConfigured) {
            console.log('Trying to verify Cloudinary configuration before upload...');
            const connectionResult = await testCloudinaryConnection();
            if (!connectionResult) {
                console.error('Cloudinary connection test failed. Check your credentials.');
                return null;
            }
        }

        // Get file details for logging
        const fileStats = fs.statSync(localFilePath);
        console.log(`File details: Size=${fileStats.size} bytes, Path=${localFilePath}`);

        // Determine resource type based on file extension
        const resourceType = getResourceType(localFilePath);
        console.log(`Uploading file to Cloudinary as ${resourceType}: ${localFilePath}`);
        
        // Set different options based on resource type
        let uploadOptions = {
            resource_type: resourceType,
            timeout: 180000, // 3 minute timeout for large videos
            use_filename: true, // Use the original filename as part of the public ID
            unique_filename: true, // Ensure filename is unique
            overwrite: false, // Don't overwrite existing files
        };
        
        // Add video-specific options
        if (resourceType === 'video') {
            uploadOptions = {
                ...uploadOptions,
                chunk_size: 6000000, // Use chunked uploads for large files (6MB chunks)
                eager: [
                    // Generate a thumbnail and different quality versions
                    { format: 'mp4', transformation: [
                        {quality: 'auto:good', fetch_format: 'mp4'}
                    ]}
                ],
                eager_async: true, // Process video transformations asynchronously
            };
        }
        
        console.log('Starting Cloudinary upload with options:', uploadOptions);
        
        // Upload to cloudinary with appropriate resource type and options
        const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

        console.log(`File uploaded to Cloudinary successfully: ${result.secure_url}`);
        console.log(`Upload result:`, {
            url: result.secure_url || result.url,
            public_id: result.public_id,
            size: result.bytes,
            format: result.format,
            resource_type: result.resource_type,
            duration: result.duration
        });

        // Remove the locally saved temporary file
        try {
            fs.unlinkSync(localFilePath);
            console.log(`Deleted local file: ${localFilePath}`);
        } catch (unlinkError) {
            console.error(`Failed to delete local file: ${localFilePath}`, unlinkError);
        }
        
        return result;
    } catch (error) {
        console.error(`Error uploading to Cloudinary: ${error.message}`);
        
        // Log the full error for debugging
        console.error('Full error details:', error);
        
        // Mark Cloudinary as mis-configured if we get auth errors
        if (error.http_code === 401 || 
            error.message.includes('API key') || 
            error.message.includes('authentication') ||
            error.message.includes('Invalid Signature')) {
            cloudinaryConfigured = false;
            console.error('⚠️ Authentication failed. Your Cloudinary API credentials are invalid.');
        }
        
        // Still attempt to clean up the local file
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
                console.log(`Deleted local file after error: ${localFilePath}`);
            }
        } catch (unlinkError) {
            console.error(`Failed to delete local file: ${localFilePath}`, unlinkError);
        }
        
        // Add detailed error logging
        console.error('Full Cloudinary error details:', {
            name: error.name,
            code: error.http_code,
            message: error.message,
            cause: error.cause ? error.cause.toString() : 'No cause available'
        });
        
        // Return null instead of returning the error object
        return null;
    }
};

const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) {
            console.log("No public_id provided for deletion");
            return null;
        }

        // Verify Cloudinary is properly configured before attempting deletion
        if (!checkCloudinaryConfig()) {
            console.error('Cloudinary is not properly configured. Deletion aborted.');
            return null;
        }

        console.log(`Deleting resource from Cloudinary: ${public_id}, type: ${resource_type}`);
        
        // Delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: resource_type,
            invalidate: true  // Invalidate CDN cache
        });
        
        console.log(`Cloudinary deletion result:`, result);
        return result;
    } catch (error) {
        console.error(`Error deleting from Cloudinary: ${error.message}`);
        return null;
    }
};

// Export a function to get the Cloudinary status
const isCloudinaryConfigured = () => cloudinaryConfigured;

export { uploadOnCloudinary, deleteOnCloudinary, isCloudinaryConfigured };