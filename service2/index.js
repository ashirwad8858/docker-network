const AWS = require('aws-sdk');
const axios = require('axios');


// Initialize the AWS SDK with your AWS credentials and region
AWS.config.update({ region: 'us-east-1' });

const secretsManager = new AWS.SecretsManager();

async function makeRequest() {
  try {
    let secretName;
    
    // Determine the current environment based on NODE_ENV
    const environment =  process.env.NODE_ENV || 'development';;

    // Set the corresponding secret name
    switch (environment) {
      case 'development':
        secretName = 'dev-env-secrets';
        break;
      case 'qa':
        secretName = 'qa-env-secrets';
        break;
      case 'staging':
        secretName = 'staging-env-secrets';
        break;
      default:
        throw new Error('Invalid or missing NODE_ENV');
    }

    // Retrieve the sensitive environment variables from AWS Secrets Manager
    const secretData = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

    // Parse the secret values as needed
    const secretObject = JSON.parse(secretData.SecretString);
    console.log("Secrete ",secretObject)
    const serviceHost = secretObject.SERVICE_HOST;
    const servicePort = secretObject.SERVICE_PORT;
    // const serviceHost = await decryptSecret(secretObject.SERVICE_HOST);
    // const servicePort = await decryptSecret(secretObject.SERVICE_PORT);

    console.log(serviceHost, servicePort);

    const serviceURL = `http://${serviceHost}:${servicePort}`;

    const response = await axios.get(serviceURL);
    console.log(response.data.message);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Add a delay (e.g., 5 seconds) before making the next request
    setTimeout(makeRequest, 5000);
  }
}

async function decryptSecret(encryptedSecret) {
    const kms = new AWS.KMS();
    const params = {
      CiphertextBlob: Buffer.from(encryptedSecret, 'base64'),
    };
  
    const decryptedData = await kms.decrypt(params).promise();
    return decryptedData.Plaintext.toString();
  }


// Start the continuous request loop
makeRequest();
