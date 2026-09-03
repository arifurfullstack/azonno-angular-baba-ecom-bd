import {
  THEME_CATALOG,
  validateThemeViewSettings,
} from './theme-catalog';

describe('THEME_CATALOG', () => {
  it('has unique section types', () => {
    const types = THEME_CATALOG.map((s) => s.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('has exactly one default option per section', () => {
    for (const section of THEME_CATALOG) {
      const defaults = section.value.filter((o) => o.isDefault);
      expect(defaults.length).toBe(1);
    }
  });

  it('has unique option names within each section', () => {
    for (const section of THEME_CATALOG) {
      const names = section.value.map((o) => o.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe('validateThemeViewSettings', () => {
  // Every section with its default option — the shape a fresh save produces.
  const fullValidPayload = THEME_CATALOG.map((section) => ({
    type: section.type,
    value: [section.value.find((o) => o.isDefault)!.name],
  }));

  it('accepts a payload selecting the default of every section', () => {
    expect(validateThemeViewSettings(fullValidPayload)).toBeNull();
  });

  it('accepts the live-shop payload shape (Category 2, Brand 1, Card 2, Nav 2, Footer 1)', () => {
    const payload = [
      { type: 'headerViews', value: ['Header 1'] },
      { type: 'showcaseViews', value: ['Showcase 2'] },
      { type: 'categoryViews', value: ['Category 2'] },
      { type: 'brandViews', value: ['Brand 1'] },
      { type: 'productViews', value: ['Tag'] },
      { type: 'productCardViews', value: ['Product Card 2'] },
      { type: 'bottomNavViews', value: ['Bottom Nav 2'] },
      { type: 'footerViews', value: ['Footer 1'] },
    ];
    expect(validateThemeViewSettings(payload)).toBeNull();
  });

  it('accepts the newly implemented options (Category 3, None, Nav 3, Footer 4, Card 5)', () => {
    const payload = [
      { type: 'categoryViews', value: ['Category 3'] },
      { type: 'brandViews', value: ['None'] },
      { type: 'productCardViews', value: ['Product Card 5'] },
      { type: 'bottomNavViews', value: ['Bottom Nav 3'] },
      { type: 'footerViews', value: ['Footer 4'] },
      { type: 'productDetailsViews', value: ['Product Details View 2'] },
    ];
    expect(validateThemeViewSettings(payload)).toBeNull();
  });

  it('accepts an empty array (shop never saved theme settings)', () => {
    expect(validateThemeViewSettings([])).toBeNull();
  });

  it('rejects a non-array payload', () => {
    expect(validateThemeViewSettings({})).toContain('must be an array');
  });

  it('rejects a non-object entry', () => {
    expect(validateThemeViewSettings(['Header 1'])).toContain('must be objects');
  });

  it('rejects an entry without a string type', () => {
    expect(validateThemeViewSettings([{ value: ['Header 1'] }])).toContain(
      'missing a string "type"',
    );
  });

  it('rejects an unknown section type', () => {
    const payload = [{ type: 'headerView', value: ['Header 1'] }];
    expect(validateThemeViewSettings(payload)).toContain('headerView');
  });

  it('rejects an unknown option name', () => {
    const payload = [{ type: 'headerViews', value: ['Header 9'] }];
    expect(validateThemeViewSettings(payload)).toContain('Header 9');
  });

  it('rejects a non-array value', () => {
    const payload = [{ type: 'showcaseViews', value: 'Showcase 2' }];
    expect(validateThemeViewSettings(payload)).toContain('array of option names');
  });

  it('rejects a non-string option name', () => {
    const payload = [{ type: 'showcaseViews', value: [42] }];
    expect(validateThemeViewSettings(payload)).toContain('non-string');
  });

  it('rejects two selections in a single-select section', () => {
    const payload = [
      { type: 'showcaseViews', value: ['Showcase 2', 'Showcase 3'] },
    ];
    expect(validateThemeViewSettings(payload)).toContain('only one');
  });

  it('allows multiple selections in a multiple-select section', () => {
    const payload = [{ type: 'productViews', value: ['Tag'] }];
    expect(validateThemeViewSettings(payload)).toBeNull();
  });
});
