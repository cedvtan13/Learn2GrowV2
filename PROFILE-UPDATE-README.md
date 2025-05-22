# Profile Update Feature

## Overview
This feature allows users to update their profile information on the Learn2Grow platform, including:
- Changing their display name
- Uploading a profile picture
- Changing their password

## Implementation Details

### Client-Side
- **File**: `scripts/profile.js` 
  - Handles form submission for profile updates
  - Provides image validation and preview functionality
  - Implements password change logic
  - Displays notifications for success/error states

- **Styles**: `styles/profile-custom.css`
  - Custom styling for profile picture uploads
  - Notification system styling
  - Responsive design elements

### Server-Side
- **API Endpoints**: 
  - `PUT /api/users/profile/update` - Updates name and profile picture
  - `POST /api/users/change-password` - Changes user password

- **User Model**: Added `profilePicture` field to user schema
  ```javascript
  profile: {
    needs:          { type: String, maxlength: 255 },
    qrCodeUrl:      { type: String },
    profilePicture: { type: String, default: '../images/default-profile.jpg' }
  }
  ```

## Security Considerations
1. Password changes require current password verification
2. Profile updates require authentication token
3. Image files are validated for type and size before upload

## Usage
1. Navigate to the profile page
2. Update name or upload a profile picture
3. To change password, click on "Change Password" to reveal password fields
4. Enter current password and new password
5. Click "Update Profile" to save changes

## Testing
See `profile-testing-plan.md` for detailed testing steps and verification procedures.

## Future Improvements
1. Add support for additional profile fields (bio, social links, etc.)
2. Implement server-side image processing to optimize storage
3. Add option to remove profile picture and revert to default
4. Implement profile visibility settings

## Known Issues
None at this time.

## Contributors
- Learn2Grow Development Team
