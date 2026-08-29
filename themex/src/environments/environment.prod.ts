const isBrowser = typeof window !== 'undefined';
let apiBase = '';

if (isBrowser) {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  if ((window as any).__env?.apiBaseLink) {
    apiBase = (window as any).__env.apiBaseLink;
  } else if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    // Auto-resolve to api.<rootDomain> for multi-subdomain architectures
    const cleanHost = hostname.replace(/^www\./, '');
    apiBase = `${protocol}//api.${cleanHost}`;
  } else {
    apiBase = window.location.origin;
  }
} else {
  const internalPort = process.env['INTERNAL_API_PORT'] || '3000';
  apiBase = process.env['INTERNAL_API_URL'] || process.env['API_BASE_LINK'] || `http://127.0.0.1:${internalPort}`;
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

