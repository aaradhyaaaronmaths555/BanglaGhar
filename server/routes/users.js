const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');

if (!AWS.config.region) {
  AWS.config.update({ region: process.env.REACT_AWS_REGION });
}

const cognito = new AWS.CognitoIdentityServiceProvider();

// GET /api/users/by-email/:email
router.get('/by-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const users = await cognito
      .listUsers({
        UserPoolId: process.env.REACT_APP_USERPOOLID,
        Filter: `email = "${email}"`,
      })
      .promise();
    if (!users.Users || users.Users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const username = users.Users[0].Username;
    const user = await cognito
      .adminGetUser({
        UserPoolId: process.env.REACT_APP_USERPOOLID,
        Username: username,
      })
      .promise();
    const userData = {
      userId: user.Username,
      name: user.UserAttributes.find((attr) => attr.Name === 'name')?.Value || 'Unknown',
      email: user.UserAttributes.find((attr) => attr.Name === 'email')?.Value || email,
      picture: user.UserAttributes.find((attr) => attr.Name === 'picture')?.Value || null,
    };
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/by-id/:id
router.get('/by-id/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await cognito
      .adminGetUser({
        UserPoolId: process.env.REACT_APP_USERPOOLID,
        Username: userId,
      })
      .promise();
    const userData = {
      userId: user.Username,
      name: user.UserAttributes.find((attr) => attr.Name === 'name')?.Value || 'Unknown',
      email: user.UserAttributes.find((attr) => attr.Name === 'email')?.Value || 'unknown@email.com',
      picture: user.UserAttributes.find((attr) => attr.Name === 'picture')?.Value || null,
    };
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router;