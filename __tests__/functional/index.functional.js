/* These are a few functional tests representing a user workflow on Dashboard GUI.
Included valid and invalid log in, that could be extented with more negative cases or combination
like missing email domain, wrong email, empty data, too long string, invalid charaters or password combinations...
Included a happy path for a single Delivery Job creation that a user will follow,
adding pick up, a vehicle type and drop off info to cover the minimum needed
working functionality on the app.
Tests also could be extended with more scenarios such as adding multiple drop offs on a job creation...
or specific tests to cover data inputs like special characters,text length, vehicle types selection...
*/

import DashboardPage from '../../lib/DashboardPage';

const { email, password } = require('../../config');

describe('Dashboard workflow Functional tests', () => {
  const dashboardPage = new DashboardPage(page);
  const pickUp = {
    firstName: 'Julia',
    lastName: 'Fernandez',
    address: 'verdi 140 08012',
  };
  const dropOff = {
    firstName: 'Pepe',
    lastName: 'Jimenez',
    address: 'mallorca 202 08036',
  };
  beforeAll(async () => {
    jest.setTimeout(999999);
  });

  describe('Login', () => {
    beforeEach(async () => {
      await dashboardPage.open('https://dashboard.sandbox.stuart.com');
    });

    it('should do a invalid login', async () => {
      const invalidPassword = 'badPassword';

      await dashboardPage.setEmail(email);
      await dashboardPage.setPassword(invalidPassword);
      await dashboardPage.logIn();

      const errordisplay = await dashboardPage.getLogInErrorMsg();

      await expect(errordisplay).toMatch('Invalid email or password. Please retry');
    });

    it('should do a valid login', async () => {
      await dashboardPage.setEmail(email);
      await dashboardPage.setPassword(password);
      await dashboardPage.logIn();

      const isLoggedIn = await dashboardPage.waitForPageToLoad('New delivery | Stuart', 3);
      await expect(isLoggedIn).toBeTruthy();
    });
  });

  describe('Single job creation', () => {
    beforeAll(async () => {
      const isLoggedIn = await dashboardPage.waitForPageToLoad('New delivery | Stuart', 3);
      await expect(isLoggedIn).toBeTruthy();
    });

    it('should fill pickUp and dropOff details', async () => {
      await dashboardPage.fillForm(pickUp, 'pickUp');
      await dashboardPage.fillForm(dropOff, 'dropOff');

      const actualPickUpName = await dashboardPage.getNameValue('pickUp');
      const actualPickUpAddress = (await dashboardPage.getAddressValue('pickUp')).toLowerCase();
      const pickUpAddressMatched = pickUp.address.split(' ').every((item) => actualPickUpAddress.includes(item));
      await expect(actualPickUpName).toContain(pickUp.firstName);
      await expect(pickUpAddressMatched).toBeTruthy();


      const actualDropOffName = await dashboardPage.getNameValue('dropOff');
      const actualDropOffAddress = (await dashboardPage.getAddressValue('dropOff')).toLowerCase();
      const dropOffAddressMatched = dropOff.address.split(' ').every((item) => actualDropOffAddress.includes(item));
      await expect(actualDropOffName).toContain(dropOff.firstName);
      await expect(dropOffAddressMatched).toBeTruthy();
    });

    it('should select a vehicle type', async () => {
      await expect(await dashboardPage.getElement('requestButton[disabled]')).not.toBeNull();
      await dashboardPage.selectVehicle('transport-motorbike', 5);
      await dashboardPage.waitForSelectorToBeEnabled('requestButton', 3);
      await expect(await dashboardPage.getElement('requestButton[disabled]')).toBeNull();
    });

    it('should request the delivery', async () => {
      await dashboardPage.requestDelivery();
      const pageTitle = 'Ongoing | Stuart';
      const seconds = 5;
      await dashboardPage.waitForPageToLoad(pageTitle, seconds);

      const actualPickUpInfo = await dashboardPage.getDeliveryInfo('pickUp');
      await expect(actualPickUpInfo.name).toContain(pickUp.firstName);
      const pickUpAddressMatched = pickUp.address.split(' ').every((item) => actualPickUpInfo.address.includes(item));
      await expect(pickUpAddressMatched).toBeTruthy();

      const actualDropOffInfo = await dashboardPage.getDeliveryInfo('dropOff');
      await expect(actualDropOffInfo.name).toContain(dropOff.firstName);
      const dropOffAddressMatched = dropOff.address.split(' ').every((item) => actualDropOffInfo.address.includes(item));
      await expect(dropOffAddressMatched).toBeTruthy();
    });
  });

  describe('Log out', () => {
    beforeAll(async () => {
      const isLoggedIn = (await dashboardPage.getTitle()) !== 'Stuart';
      await expect(isLoggedIn).toBeTruthy();
    });

    it('should log out', async () => {
      await dashboardPage.logOut();
      const pagetTitle = 'Stuart';
      const seconds = 3;
      const isLoggedOut = await dashboardPage.waitForPageToLoad(pagetTitle, seconds);
      await expect(isLoggedOut).toBeTruthy();
    });
  });
});
