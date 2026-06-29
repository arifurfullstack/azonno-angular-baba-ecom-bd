const isBrowser = typeof window !== 'undefined';
let apiBase = '';

if (isBrowser) {
  if ((window as any).__env?.apiBaseLink) {
    apiBase = (window as any).__env.apiBaseLink;
  } else {
    apiBase = window.location.origin;
  }
} else {
  const internalPort = process.env['INTERNAL_API_PORT'] || '3000';
  apiBase = process.env['INTERNAL_API_URL'] || `http://127.0.0.1:${internalPort}`;
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

