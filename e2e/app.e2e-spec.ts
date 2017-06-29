import { ChatCodesWebPage } from './app.po';

describe('chat-codes-web App', () => {
  let page: ChatCodesWebPage;

  beforeEach(() => {
    page = new ChatCodesWebPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
