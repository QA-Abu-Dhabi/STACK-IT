Cypress.on('uncaught:exception', (err) => {
  // Игнорируем специфические ошибки, которые не критичны для тестов
  if (
    err.message.includes("Cannot access 'dQu' before initialization") ||
    err.message.includes("Cannot access 'oQu' before initialization") ||
    err.message.includes("Cannot access 'T1' before initialization")
  ) {
    return false; // Cypress продолжит выполнение тестов
  }

  // Для всех остальных ошибок пусть Cypress выбрасывает исключение
  throw err;
});

describe('STACK', () => {
  let AuthData = null;
  let TestData = null;

  before(() => {
    cy.fixture("AuthData").then((data) => {
      AuthData = data;
    });
    cy.fixture("TestData").then((data) => {
      TestData = data;
    });
  });

  beforeEach(() => {
    cy.session('authSession', () => {
      cy.LoginAndSetSession(AuthData);
    }, {
      validate: () => {
        cy.window().then((win) => {
          const commonValue = JSON.parse(win.localStorage.getItem('common'));
          expect(commonValue.token).to.exist;
        });
      },
    });
    cy.visit('/fl');
    cy.contains('Адреса проживающих').should('be.visible').click();
  });

  it('create data', () => {
    TestData.forEach((data) => {
      cy.get('[title="Добавить запись"]').click();
      cy.contains('Район').should('be.visible').click();

      cy.get('input[data-test-id="Название района"]').click().clear();
      if (data.Name) {
        cy.get('input[data-test-id="Название района"]').type(data.Name, { force: true });
      }
      cy.get('input[data-test-id="Номер в списке"]').click().clear();
      if (data.Number) {
        cy.get('[data-test-id="Номер в списке"]').type(data.Number, { force: true });
      }

      if (data.Expected == 'passed')
      {
        cy.contains('Внести').should('be.visible').click();
        cy.get('div.row.no-gutters.align-center.justify-start').should('contain.text', data.Name);
        cy.log('Positive test verified');
      }
      else if (data.Expected == 'failed')
      {
        cy.get('.v-messages__message').should('be.visible').and('contain', 'Поле не может быть пустым');
        cy.get('[data-cy="btn-save"]').should('be.disabled');
        cy.log('Negative test verified');
        cy.contains('Отмена').should('be.visible').click();
      }
    })
  });

  it('edit data', () => {
    TestData.forEach((data) => {
      if (data.Expected === "passed" && (data.NewName || data.NewNumber)) {
        // Найти строку таблицы по уникальному названию
        cy.contains('td', data.Name)
          .parents('tr') // Подняться на уровень строки таблицы
          .find('[type="button"]') // Найти button в строке
          .click(); // Тыкнуть на кнопку

        // Вставляем новые значения !!!!!!!!!!
        if (data.NewName) {
          cy.get('input[data-test-id="Название района"]').click().clear();
          cy.get('input[data-test-id="Название района"]').type(data.NewName, { force: true });
          cy.get('input[data-test-id="Номер в списке"]').click(); // Кликаем на другое поле, чтобы активировалась кнопка сохранить
        }
        if (data.NewNumber) {
          cy.get('input[data-test-id="Номер в списке"]').click().clear();
          cy.get('[data-test-id="Номер в списке"]').type(data.NewNumber, { force: true });
          cy.get('input[data-test-id="Название района"]').click(); // Кликаем на другое поле, чтобы активировалась кнопка сохранить
        }

        if (data.NewExpected == 'passed')
        {
          cy.contains('Сохранить').should('be.visible').click();
          cy.get('div.row.no-gutters.align-center.justify-start').should('contain.text', data.NewName);
          cy.log('Positive test verified');
        }
        else if (data.NewExpected == 'failed')
        {
          cy.get('.v-messages__message').should('be.visible').and('contain', 'Поле не может быть пустым');
          cy.get('[data-cy="btn-save"]').should('be.disabled');
          cy.log('Negative test verified');
          cy.contains('Отмена').should('be.visible').click();
        }
        
        //cy.get('[data-cy="btn-save"]').click(); этот клик щас не нужен
      }
    })
  });

  it('delete data', () => {
    TestData.forEach((data) => {
      // Не удаляем то, чего не создано
      if (data.Expected === 'failed' || data.NewExpected === 'failed') {
        return;
      }
      
      const searchName = data.NewName || data.Name;

      // Найдём строку таблицы
      cy.contains('td', searchName)
        .parents('tr') // Поднимемся на уровень строки таблицы
        .find('input[type="checkbox"]') // Найдём чекбокс в строке
        .check({ force: true }); // Установим чекбокс
    
      // Проверим, что чекбокс установлен
      cy.contains('td', searchName)
        .parents('tr')
        .find('input[type="checkbox"]')
        .should('be.checked');
      
      // Удаляем
      cy.get('[data-cy="btn-delete"]').should('be.visible').click();
      cy.get('[data-cy="btn-yes"]').click();

      // Подождем пока элемент удалится и прогресс бар исчезнет
      cy.contains('td', searchName).should('not.exist');
    });
  });
});