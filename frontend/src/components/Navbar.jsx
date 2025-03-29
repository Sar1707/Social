// Add this function at the top of the component, just after the function definition
// Helper function to process avatar URL for proper display
const getValidAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  // If it's a string URL
  if (typeof avatar === 'string') {
    if (avatar.startsWith('http')) {
      return avatar;
    } else if (avatar.startsWith('/temp/')) {
      return `${window.location.origin}${avatar}`;
    }
  }
  
  // If it's an object with url property
  if (avatar && typeof avatar === 'object' && avatar.url) {
    if (typeof avatar.url === 'string') {
      if (avatar.url.startsWith('http')) {
        return avatar.url;
      } else if (avatar.url.startsWith('/temp/')) {
        return `${window.location.origin}${avatar.url}`;
      }
    }
  }
  
  // Default avatar fallback
  return null;
};

// Then update any avatar rendering in the JSX by replacing avatar.url with getValidAvatarUrl(avatar)
// For example:
<Avatar 
  src={user ? getValidAvatarUrl(user.avatar) : null} 
  alt={user?.username || 'User'} 
/>

// If you're using user.avatar.url directly, change it to getValidAvatarUrl(user.avatar) 