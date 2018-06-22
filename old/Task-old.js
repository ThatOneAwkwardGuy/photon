import stores from '../store/shops';
import Shopify from './Shopify';

export default class Task {
  constructor(options, forceUpdateFunction) {
    this.forceUpdate = forceUpdateFunction;
    this.task = options.task;
    this.profile = options.profile;
    this.status = 'Not Started';
    this.active = false;
    this.run = this.run.bind(this);
    this.stopTask = this.stopTask.bind(this);
  }

  run() {
    this.handleChangeStatus('Started');
    switch (this.task.mode) {
    case 'url':
      this.active = true;
      this.urlMode();
      break;
    case 'keywords':
      this.active = true;
      this.keywordsMode();
      break;
    case 'variant':
      this.active = true;
      this.variantMode();
      break;
    case 'homepage':
      this.active = true;
      this.homepageMode();
      break;
    default:
      this.handleChangeStatus('Stopped');
      break;
    }
  }

  handleChangeStatus(status) {
    this.status = status;
    this.forceUpdate();
  }

  stopTask() {
    this.active = false;
  }

  processKeywords() {
    const keywordsArray = this.task.keywords.split(',');
    const positiveKeywords = [];
    const negativeKeywords = [];
    this.handleChangeStatus('Processing Keywords');
    keywordsArray.forEach(element => {
      if (element[0] === '+') {
        positiveKeywords.push(element.substr(1));
      } else if (element[0] === '-') {
        negativeKeywords.push(element.substr(1));
      }
    });
    return {
      positiveKeywords,
      negativeKeywords
    };
  }

  returnTrueIfKeywordsMatching(text) {
    const keywords = this.processKeywords();
    const nameArray = text.toLowerCase().split(/[\s,]+/);
    if (
      nameArray != undefined &&
      _.difference(nameArray, keywords.positiveKeywords).length === 0 &&
      _.difference(nameArray, keywords.negativeKeywords).length ===
        nameArray.length
    ) {
      return true;
    } else {
      return false;
    }
  }

  async checkPageForKeywords() {
    const pageHTML = await rp({
      method: 'GET',
      uri: `${stores[this.task.store]}`,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36'
      }
    });
    const page = cheerio.load(pageHTML);
    page('a').each(() => {
      if (this.returnTrueIfKeywordsMatching(page(this).text())) {
        console.log(page(this).attr('href'));
        return page(this).attr('href');
      }
    });
  }

  async urlMode() {
    const task = new Shopify(this);
    task.completeCheckout();
  }
}
