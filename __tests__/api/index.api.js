/* These are a few api tests covering the main functionality of creating a job delivery
with the minimum necesary data or mandatory fields.
Also added some negative cases to check that the job creation is not performed and giving us an error
when we introduced incomplete mandatory address field, an empty string, an empty object
as well as JS injection.
There could be more cases to cover like filling non mandatory information,
having multiple packages with different dropoffs,
or adding some unhappy paths like the once on the list below:
- acces token: invalid / valid but expired 
- special chars / long string
- number / negative numbers / float
- null / boolean / undefined
- not valid object  
- inject sql / inject eval()
- headers: custom, auth, user-agent, content-type,...
*/

const clonedeep = require('lodash.clonedeep');
const {
  Authenticator,
  Environment,
  HttpClient,
} = require('stuart-client-js');
const { API_CLIENT_ID, API_SECRET } = require('../../config');

describe('API tests', () => {
  const authenticator = new Authenticator(Environment.SANDBOX(), API_CLIENT_ID, API_SECRET);
  const httpClient = new HttpClient(authenticator);

  describe('Job creation', () => {
    const validJob = {
      job: {
        transport_type: 'bike',
        pickups: [
          {
            address: '67 Bailen, 08009 Barcelona',
            contact: {
              firstname: 'Fermin',
              lastname: 'Tarradellas',
            },
          },
        ],
        dropoffs: [
          {
            address: '18 Vallfogona, 08012 Barcelona',
            contact: {
              firstname: 'Muriel',
              lastname: 'Defrau',
            },
          },
        ],
      },
    };

    it('should create a job properly with mandatory fields', async () => {
      const response = await httpClient.performPost('/v2/jobs', JSON.stringify(validJob));
      expect(response.statusCode).toBe(201);
      expect(response.body.transport_type).toBe('bike');
      expect(response.body.pricing.price_tax_excluded).toBe(5);
      const jobID = response.body.id;

      const responseGet = await httpClient.performGet(`/v2/jobs/${jobID}`);
      const actualPickUpName = responseGet.body.deliveries[0].pickup.contact.firstname;
      expect(actualPickUpName).toBe(validJob.job.pickups[0].contact.firstname);
    });

    it('should return error when JS injection', async () => {
      const invalidJob = clonedeep(validJob);
      invalidJob.job.dropoffs[0].contact.firstname = '<img src=z onerror=alert("JS injection")>';

      const responsePost = await httpClient.performPost('/v2/jobs', JSON.stringify(invalidJob));
      expect(responsePost.statusCode).toBe(201);
      const jobID = responsePost.body.id;
      const responseGet = await httpClient.performGet(`/v2/jobs/${jobID}`);
      // to discuss: this string isnt sanitised, isn't it ?
      console.log(responseGet.body.deliveries[0].dropoff.contact.firstname);
    });

    it('should return error when address not complete', async () => {
      const invalidJob = clonedeep(validJob);
      invalidJob.job.dropoffs[0].address = 'Vallfogona, 08012 Barcelona';

      const response = await httpClient.performPost('/v2/jobs', JSON.stringify(invalidJob));
      expect(response.statusCode).toBe(422);
      expect(response.body.error).toBe('RECORD_INVALID');
      expect(response.body.message).toBe('Unable to save record');
      // maybe different error mssg for each particular situation, e.g.: "invalid address"
    });

    it('should return error when transport type is an empty string', async () => {
      const invalidJob = clonedeep(validJob);
      invalidJob.job.transport_type = '';

      const response = await httpClient.performPost('/v2/jobs', JSON.stringify(invalidJob));
      expect(response.statusCode).toBe(422);
      expect(response.body.error).toBe('RECORD_INVALID');
      expect(response.body.message).toBe('Unable to save record');
      // specific error message, e.g.: "empty transport type"
    });

    it('should return error when dropoff is an empty object', async () => {
      const invalidJob = clonedeep(validJob);
      invalidJob.job.dropoffs = {};

      const response = await httpClient.performPost('/v2/jobs', JSON.stringify(invalidJob));
      expect(response.statusCode).toBe(422);
      expect(response.body.error).toBe('RECORD_INVALID');
      expect(response.body.message).toBe('Unable to save record');
      // specific error message, e.g.: "missing dropOff info"
    });
  });
});
