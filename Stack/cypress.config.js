const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'https://demo.app.stack-it.ru',
    video: true,
    videosFolder: 'cypress/videos'
  },
});
