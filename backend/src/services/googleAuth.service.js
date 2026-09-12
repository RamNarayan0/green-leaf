const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuthService = {
  async verifyGoogleToken(token) {
    if (!token || !process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Google authentication is not configured');
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      throw new Error('Google account email is not verified');
    }
    return payload;
  }
};

module.exports = googleAuthService;
