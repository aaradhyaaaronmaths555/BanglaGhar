import { CognitoUserPool } from "amazon-cognito-identity-js";

// Debug logs to verify environment variables
console.log("REACT_APP_USERPOOLID:", process.env.REACT_APP_USERPOOLID);
console.log("REACT_APP_CLIENTID:", process.env.REACT_APP_CLIENTID);
console.log("REACT_APP_APIGATEWAY_URL:", process.env.REACT_APP_APIGATEWAY_URL);

const poolData = {
  UserPoolId: process.env.REACT_APP_USERPOOLID,
  ClientId: process.env.REACT_APP_CLIENTID,
};

// Validate environment variables
if (!poolData.UserPoolId || !poolData.ClientId) {
  throw new Error("Both REACT_APP_USERPOOLID and REACT_APP_CLIENTID must be defined in the environment variables.");
}

console.log(poolData);
const userPool = new CognitoUserPool(poolData);

export { poolData, userPool };
