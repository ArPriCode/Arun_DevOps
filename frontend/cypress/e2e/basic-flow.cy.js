describe('Cinemora basic user flow', () => {
  it('loads home page and navigates to a series detail', () => {
    cy.visit('/');

    // Home should render trending or series list
    cy.contains(/trending/i).should('exist');

    // Click on first series card if available
    cy.get('[data-testid="series-card"]').first().click();

    // Should navigate to series detail page
    cy.url().should('include', '/series-detail/');
    cy.contains(/reviews/i).should('exist');
  });
});

