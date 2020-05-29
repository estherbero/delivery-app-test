
export default class DashboardPage {
  constructor(page) {
    this.page = page;
  }

  async open(url) {
    await this.page.goto(url);
  }

  async setEmail(email) {
    await this.page.type('#email', email);
  }

  async setPassword(pwd) {
    await this.page.type('#password', pwd);
  }

  async logIn() {
    await this.clickWhenElementReady('logInButton');
  }

  async getLogInErrorMsg() {
    return await this.page.waitForSelector('#logInError', { timeout: 3000 });
  }

  async fillForm(details, action) {
    const selector = 'Card-0-fields-field-';
    await this.typeWhenElementReady(`${action + selector}address`, details.address);

    await this.waitForAutoComplete();
    await this.clickWhenElementReady('autocompleteItems');

    await this.typeWhenElementReady(`${action + selector}firstname`, details.firstName);
    await this.typeWhenElementReady(`${action + selector}lastname`, details.lastName);
  }

  async selectVehicle(vehicle, seconds) {
    await this.waitForSelectorToBeEnabled(vehicle, seconds);
    await this.clickWhenElementReady(vehicle);
  }

  async requestDelivery() {
    await this.clickWhenElementReady('requestButton');
  }

  async getDeliveryInfo(selector) {
    const orderSelector = `[id^="${selector}-"]`;
    await this.page.waitForSelector(orderSelector);
    return this.page.evaluate((selector) => {
      const deliveryInfo = {};
      const delivery = document.querySelector(selector).children;
      for (let i = 0; i < delivery.length; i++) {
        if (delivery[i].id.includes('FullName')) {
          deliveryInfo.name = delivery[i].innerHTML;
        }
        if (delivery[i].id.includes('Address')) {
          deliveryInfo.address = delivery[i].innerHTML.toLowerCase();
        }
      }
      return deliveryInfo;
    }, orderSelector);
  }

  async logOut() {
    await this.clickWhenElementReady('accountMenuButton');
    await this.clickWhenElementReady('navbarLinkLogOut');
  }

  async clickWhenElementReady(selector) {
    await this.page.waitForSelector(`#${selector}`);
    await this.page.click(`#${selector}`);
  }

  async typeWhenElementReady(selector, text) {
    await this.waitForSelectorToBeEnabled(selector, 3);
    await this.page.type(`#${selector}`, text);
  }

  async getElement(selector) {
    return await this.page.$(`#${selector}`);
  }

  async getValue(selector) {
    return await this.page.evaluate((selector) => document.querySelector(`#${selector}`).value, selector);
  }

  async getAddressValue(action) {
    return await this.getValue(`${action}Card-0-fields-field-address`);
  }

  async getNameValue(action) {
    const selector = 'Card-0-fields-field-';
    const firstName = await this.getValue(`${action + selector}firstname`);
    const lastName = await this.getValue(`${action + selector}lastname`);
    return `${firstName} ${lastName}`;
  }

  async getListLength(selector) {
    return await this.page.evaluate((selector) => document.querySelector(`#${selector}`).children.length, selector);
  }

  async getTitle() {
    return await this.page.title();
  }

  async sanitizePageTitle(title) {
    if (!title.includes('(')) {
      return title;
    }
    const untilParenthesis = title.substring(0, title.indexOf('('));
    const fromParenthesis = title.substring(title.indexOf(')'), title.length);
    // trim to avoid having two consecutive spaces when joint
    return untilParenthesis.trim() + fromParenthesis;
  }

  async waitForPageToLoad(pageTitle, seconds) {
    let actualPageTitle = '';
    while (pageTitle !== actualPageTitle && seconds > 0) {
      await this.sleep(1000);
      seconds--;
      actualPageTitle = await this.sanitizePageTitle(await this.getTitle());
    }
    return pageTitle === actualPageTitle;
  }

  async waitForAutoComplete(seconds = 3) {
    // we just want only one option in the autocomplete, so we wait for it
    while ((await this.getListLength('autocompleteItems')) > 1 && seconds > 0) {
      await this.sleep(1000);
      seconds--;
    }
  }

  async waitForSelectorToBeEnabled(selector, seconds) {
    await this.page.waitForSelector(`#${selector}`);
    let element = {};
    while (element && seconds > 0) {
      await this.sleep(1000);
      seconds--;
      element = await this.page.$(`#${selector}[disabled]`);
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
