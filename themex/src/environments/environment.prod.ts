const isBrowser = typeof window !== 'undefined';
let apiBase = '';

if (isBrowser) {
  if ((window as any).__env?.apiBaseLink) {
    apiBase = (window as any).__env.apiBaseLink;
  } else {
    apiBase = window.location.origin;
  }
} else {
  apiBase = process.env['API_BASE_LINK'] || 'http://localhost:4220';
}

export const environment = {
  production: true,
  apiBaseLink: apiBase,
  ftpBaseLink: apiBase,
  ftpPrefixPath: `${apiBase}/api/upload/images`,
  ftpPrefix: '',
  userBaseUrl: '/my-account',
  userLoginUrl: 'login',
  storageSecret: 'SOFT_ECOM_2021_IT_1998',
  VERSION: 1,
};
