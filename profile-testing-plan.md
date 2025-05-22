# Profile Update Testing Plan

## Testing Summary
This document outlines the testing steps for the profile update functionality, including profile picture uploads and password changes.

## Prerequisites
1. The server should be running
2. A test user account should be available for testing

## Test Cases

### 1. Profile Name Update
- Login to the Learn2Grow platform
- Navigate to the profile page
- Change the name field
- Click "Update Profile"
- Verify the success notification appears
- Verify the new name appears correctly
- Reload the page and verify the name is still updated

### 2. Profile Picture Upload
- Login to the Learn2Grow platform
- Navigate to the profile page
- Click "Change Photo" button
- Select a valid image file (JPEG, PNG, GIF, or WEBP)
- Click "Update Profile"
- Verify the success notification appears
- Verify the new profile picture appears correctly
- Reload the page and verify the picture is still updated

### 3. Password Change
- Login to the Learn2Grow platform
- Navigate to the profile page
- Enter current password
- Click "Change Password" to expand the password fields
- Enter new password and confirm new password
- Click "Update Profile"
- Verify the success notification appears
- Logout and login with the new password to verify it was changed

### 4. Validation Testing
- Try updating with empty name field (should show error)
- Try uploading a non-image file (should show error)
- Try uploading an image over 5MB (should show error)
- Try changing password with incorrect current password (should show error)
- Try changing password with mismatched confirmation (should show error)
- Try changing password with less than 8 characters (should show error)

## Testing Tools
1. Manual testing through the UI
2. Automated API testing using the `test-profile-update.js` script
3. Manual API testing using the `test-profile-update.html` page

## Expected Results
All functionality should work correctly with proper validation and error handling:
- Profile name updates save and persist
- Profile picture uploads save and display correctly
- Password changes apply and allow login with the new password
- Validation errors show appropriate notifications

## Testing Status
- [ ] Profile name update
- [ ] Profile picture upload
- [ ] Password change
- [ ] Validation tests

## Notes
- The profile picture is stored as a Base64 data URL. For production use, consider storing images in a file storage system instead.
- The password change functionality requires the current password to be provided for security.
