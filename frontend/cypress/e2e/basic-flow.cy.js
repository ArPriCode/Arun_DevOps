describe('Cinemora basic user flow', () => {
  it('loads home page successfully', () => {
    cy.visit('/');

    // Page title should be present
    cy.title().should('include', 'CINEMORA');

    // Root element should render
    cy.get('#root').should('exist');
  });

  it('shows navigation bar', () => {
    cy.visit('/');

    // Navbar should be present
    cy.get('nav, .navbar, header').should('exist');
  });

  it('navigates to login page', () => {
    cy.visit('/login');

    // Login page should render a form
    cy.get('form, input[type="email"], input[type="password"]').should('exist');
  });

  it('navigates to signup page', () => {
    cy.visit('/signup');

    // Signup page should render a form
    cy.get('form, input[type="email"], input[type="password"]').should('exist');
  });

  it('navigates to series page', () => {
    cy.visit('/series');

    // Series page should render
    cy.get('#root').should('not.be.empty');
  });

  it('navigates to series detail if cards exist', () => {
    cy.visit('/');

    // If series cards are present, click the first one
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="series-card"]').length > 0) {
        cy.get('[data-testid="series-card"]').first().click();
        cy.url().should('include', '/series-detail/');
        cy.contains(/reviews/i).should('exist');
      } else {
        // Backend not available in CI — just verify home page loaded
        cy.log('No series cards found (backend not available) — skipping navigation test');
        cy.get('#root').should('exist');
      }
    });
  });
});
