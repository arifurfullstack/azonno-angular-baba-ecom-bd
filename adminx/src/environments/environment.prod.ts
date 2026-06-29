const isBrowser = typeof window !== 'undefined';
let apiBase = '';
let adminDomain = '';

if (isBrowser) {
  const hostname = window.location.hostname;
  adminDomain = hostname;
  if ((window as any).__env?.apiBaseLink) {
    apiBase = (window as any).__env.apiBaseLink;
    adminDomain = (window as any).__env.adminDomain || hostname;
  } else {
    // Same-origin API: domain.com/api (no subdomain needed)
    apiBase = window.location.origin;
  }
}

export const environment = {
  production: true,
  name: adminDomain,
  domain: adminDomain,
  baseLink: apiBase,
  paymentBaseLink: apiBase,
  apiBaseLink: apiBase,
  ftpBaseLink: apiBase,
  ftpPrefixPath: `${apiBase}/api/upload/images`,
  apiBaseLinkSaleecom: apiBase,
  ftpPrefix: '/api',
  userLoginUrl: 'login',
  userBaseUrl: '',
  appBaseUrl: '/',
  adminBaseUrl: '',
  adminLoginUrl: 'login',
  storageSecret: 'SOFT_2021_IT_1998',
  adminTokenSecret: 'SOFT_ADMIN_1995_&&_SOJOL_dEv',
  userTokenSecret: 'SOFT_ADMIN_1996_&&_SOBUR_dEv',
  apiTokenSecret: 'SOFT_API_1998_&&_SAZIB_dEv',
  vendorLoginUrl: 'login',
  vendorBaseUrl: '',
  vendorSecretKey: 'saleecoMVendoRLogiNSecreT2025',
  VERSION: 2,
};

