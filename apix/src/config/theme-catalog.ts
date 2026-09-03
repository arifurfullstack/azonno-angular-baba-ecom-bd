/**
 * THEME CATALOG — single source of truth for storefront theme customization.
 *
 * Served publicly via GET /api/setting/theme-catalog (consumed by the admin
 * theme-view page) and used to validate `themeViewSettings` writes. The
 * storefront (themex) switches on the exact `name` strings below — renaming
 * an option here is a breaking change for saved shop settings.
 *
 * Keep adminx's bundled fallback (assets/theme-catalog.json) in sync when
 * editing this file.
 */

export interface ThemeCatalogOption {
  name: string;
  image?: string;
  note?: string;
  isDefault: boolean;
}

export interface ThemeCatalogSection {
  name: string;
  type: string;
  selectType: 'single' | 'multiple';
  value: ThemeCatalogOption[];
}

export const THEME_CATALOG: ThemeCatalogSection[] = [
  {
    name: 'Header Section',
    type: 'headerViews',
    selectType: 'single',
    value: [
      {
        name: 'Header 1',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-ba10e.webp?resolution=2876_272',
        isDefault: true,
      },
      {
        name: 'Header 2',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-b5810.webp?resolution=2880_288',
        isDefault: false,
      },
      {
        name: 'Header 3',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Showcase Section',
    type: 'showcaseViews',
    selectType: 'single',
    value: [
      {
        name: 'Showcase 2',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-b5c10.webp?resolution=2844_718',
        isDefault: true,
      },
      {
        name: 'Showcase 3',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-8b79.webp?resolution=2770_856',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Category Section',
    type: 'categoryViews',
    selectType: 'single',
    value: [
      {
        name: 'Category 1',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-9f0c.webp?resolution=2764_418',
        isDefault: true,
      },
      {
        name: 'Category 2',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-9837.webp?resolution=2232_968',
        isDefault: false,
      },
      {
        name: 'Category 3',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-20-at-8-c60c.webp?resolution=1389_214',
        isDefault: false,
      },
      {
        name: 'None',
        image:
          'https://cdn.saleecom.com/upload/images/no-category-757d.webp?resolution=500_500',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Brand Section',
    type: 'brandViews',
    selectType: 'single',
    value: [
      {
        name: 'None',
        image:
          'https://cdn.saleecom.com/upload/images/no-brand-8272.webp?resolution=522_469',
        isDefault: true,
      },
      {
        name: 'Brand 1',
        image:
          'https://cdn.saleecom.com/upload/images/no-brand-8272.webp?resolution=522_469',
        note: 'Brand logo strip below the category section',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Product Section',
    type: 'productViews',
    selectType: 'multiple',
    value: [
      {
        name: 'Tag',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-afd4.webp?resolution=2212_744',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Product Card',
    type: 'productCardViews',
    selectType: 'single',
    value: [
      {
        name: 'Product Card 1',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-d99f.webp?resolution=2734_736',
        isDefault: false,
      },
      {
        name: 'Product Card 2',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-10070.webp?resolution=2728_788',
        isDefault: false,
      },
      {
        name: 'Product Card 3',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-4780.webp?resolution=2738_726',
        isDefault: true,
      },
      {
        name: 'Product Card 4',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-03-20-at-8-89b2.webp?resolution=1376_388',
        isDefault: false,
      },
      {
        name: 'Product Card 5',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Bottom Nav',
    type: 'bottomNavViews',
    selectType: 'single',
    value: [
      {
        name: 'Bottom Nav 1',
        image:
          'https://cdn.saleecom.com/upload/images/b-1-36f7.webp?resolution=402_60',
        isDefault: true,
      },
      {
        name: 'Bottom Nav 2',
        image:
          'https://cdn.saleecom.com/upload/images/b-2-19c5.webp?resolution=407_98',
        isDefault: false,
      },
      {
        name: 'Bottom Nav 3',
        image:
          'https://cdn.saleecom.com/upload/images/b-3-f458.webp?resolution=403_63',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Footer Section',
    type: 'footerViews',
    selectType: 'single',
    value: [
      {
        name: 'Footer 1',
        image:
          'https://cdn.saleecom.com/upload/images/footer-1-3692.webp?resolution=1475_322',
        isDefault: true,
      },
      {
        name: 'Footer 2',
        image:
          'https://cdn.saleecom.com/upload/images/footer-2-f55d.webp?resolution=1540_340',
        isDefault: false,
      },
      {
        name: 'Footer 3',
        image:
          'https://cdn.saleecom.com/upload/images/footer-3-f863.webp?resolution=1634_359',
        isDefault: false,
      },
      {
        name: 'Footer 4',
        image:
          'https://cdn.saleecom.com/upload/images/screenshot-2025-07-19-110709-3f8a.webp?resolution=1904_274',
        isDefault: false,
      },
    ],
  },
  {
    name: 'Product Details',
    type: 'productDetailsViews',
    selectType: 'single',
    value: [
      {
        name: 'Product Details View 1',
        isDefault: true,
      },
      {
        name: 'Product Details View 2',
        isDefault: false,
      },
    ],
  },
];

/**
 * Validate a `themeViewSettings` payload against THEME_CATALOG.
 * Pure function — returns a human-readable error naming the offending
 * entry, or null when the payload is valid. An empty array is valid
 * (a shop that never saved theme settings).
 */
export function validateThemeViewSettings(input: unknown): string | null {
  if (!Array.isArray(input)) {
    return 'themeViewSettings must be an array';
  }
  for (const entry of input) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return 'themeViewSettings entries must be objects';
    }
    const { type, value } = entry as { type?: unknown; value?: unknown };
    if (typeof type !== 'string' || !type) {
      return 'themeViewSettings entry is missing a string "type"';
    }
    const section = THEME_CATALOG.find((s) => s.type === type);
    if (!section) {
      return `Unknown theme section type "${type}"`;
    }
    if (!Array.isArray(value)) {
      return `Section "${type}" value must be an array of option names`;
    }
    for (const name of value) {
      if (typeof name !== 'string') {
        return `Section "${type}" contains a non-string option name`;
      }
      if (!section.value.some((option) => option.name === name)) {
        return `Unknown option "${name}" in section "${type}"`;
      }
    }
    if (section.selectType === 'single' && value.length > 1) {
      return `Section "${type}" allows only one selected option`;
    }
  }
  return null;
}
