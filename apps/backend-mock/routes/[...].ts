import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  return `
<h1>Mock API</h1>
<h2>Service is running</h2>
<ul>
<li><a href="/api/user">/api/user/info</a></li>
<li><a href="/api/menu">/api/menu/all</a></li>
<li><a href="/api/auth/codes">/api/auth/codes</a></li>
<li><a href="/api/auth/login">/api/auth/login</a></li>
<li><a href="/api/upload">/api/upload</a></li>
</ul>
`;
});
