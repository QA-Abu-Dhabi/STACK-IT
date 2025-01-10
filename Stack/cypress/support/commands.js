import FingerprintJS from '@fingerprintjs/fingerprintjs';

Cypress.Commands.add('LoginAndSetSession', (AuthData) => {
    return cy.wrap(FingerprintJS.load())
      .then((fp) => fp.get())
      .then((result) => {
        const fingerprint = result.visitorId;

        return cy.request({
          method: 'POST',
          url: 'https://demo.app.stack-it.ru/app/graphql',
          headers: { 'content-type': 'application/json' },
          body: {
            query: `
            mutation ($login: String!, $password: String!, $fingerprint: String!, $forceLogin: Boolean) {
            authentication {
            security {
            login(
              username: $login
              password: $password
              fingerprint: $fingerprint
              forceLogin: $forceLogin
              ) {
                accessToken
                refreshToken
                }
              }
              }
              }`,
            
            variables: {
              login: AuthData.login,
              password: AuthData.password,
              fingerprint: fingerprint,
              forceLogin: true
            },
          },
        });
      })
      .then((response) => {
        if (response.body.errors) {
          cy.log('GraphQL Errors:', JSON.stringify(response.body.errors));
          throw new Error(`GraphQL error: ${response.body.errors[0].message}`);
        }

      expect(response.status).to.eq(200);
      const { accessToken } = response.body.data.authentication.security.login;

      // Сохраняем токен в localStorage
      cy.window().then((win) => {
        const commonValue = JSON.parse(win.localStorage.getItem('common')) || {};
        commonValue.token = accessToken; // Добавляем токен
        win.localStorage.setItem('common', JSON.stringify(commonValue));
      });
    });
  });
