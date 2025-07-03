# UniRent WebCraft Client-Side Security Integration Guide

This document provides guidance for integrating with the security features of the UniRent WebCraft application from the client-side perspective. It covers how frontend code should interact with the backend security features to ensure a secure application.

## Table of Contents

1. [CSRF Protection](#csrf-protection)
2. [Content Security Policy](#content-security-policy)
3. [Secure Cookie Handling](#secure-cookie-handling)
4. [Input Validation](#input-validation)
5. [Error Handling](#error-handling)
6. [Security Best Practices](#security-best-practices)

## CSRF Protection

### Overview

Cross-Site Request Forgery (CSRF) protection requires that all state-changing requests (POST, PUT, DELETE) include a valid CSRF token. This token must be fetched from the server and included in subsequent requests.

### Integration Steps

1. **Fetch a CSRF Token**

   Before making any state-changing request, fetch a CSRF token from the `/api/csrf-token` endpoint:

   ```javascript
   async function getCsrfToken() {
     const response = await fetch('/api/csrf-token');
     const data = await response.json();
     return data.csrfToken;
   }
   ```

2. **Include the Token in Requests**

   Include the token in the headers of your requests:

   ```javascript
   async function makeSecureRequest(url, method, body) {
     const csrfToken = await getCsrfToken();
     
     const response = await fetch(url, {
       method: method,
       headers: {
         'Content-Type': 'application/json',
         'CSRF-Token': csrfToken
       },
       body: JSON.stringify(body)
     });
     
     return response.json();
   }
   ```

3. **Handle CSRF Errors**

   If a CSRF token validation fails, the server will respond with a 403 status code. Handle this error appropriately:

   ```javascript
   async function makeSecureRequestWithErrorHandling(url, method, body) {
     try {
       const result = await makeSecureRequest(url, method, body);
       return result;
     } catch (error) {
       if (error.status === 403) {
         // CSRF validation failed, refresh the page or fetch a new token
         alert('Your session has expired. Please refresh the page and try again.');
         window.location.reload();
       } else {
         // Handle other errors
         console.error('Request failed:', error);
       }
     }
   }
   ```

4. **Integration with Form Submissions**

   For form submissions, include the CSRF token as a hidden field:

   ```javascript
   async function setupForm(formElement) {
     const csrfToken = await getCsrfToken();
     
     // Create a hidden input for the CSRF token
     const tokenInput = document.createElement('input');
     tokenInput.type = 'hidden';
     tokenInput.name = '_csrf';
     tokenInput.value = csrfToken;
     
     // Add the token to the form
     formElement.appendChild(tokenInput);
   }
   ```

## Content Security Policy

### Overview

The Content Security Policy (CSP) restricts which resources can be loaded and executed in the page. The server sets these restrictions through headers, but client-side code needs to be written with these restrictions in mind.

### Integration Guidelines

1. **Avoid Inline Scripts**

   The CSP restricts inline scripts. Instead of using inline scripts, use event listeners added through JavaScript:

   ```javascript
   // AVOID this (inline event handler):
   <button onclick="doSomething()">Click me</button>

   // USE this instead:
   <button id="myButton">Click me</button>
   <script>
     document.getElementById('myButton').addEventListener('click', doSomething);
   </script>
   ```

2. **Use CSP Nonces for Essential Inline Scripts**

   If you absolutely need an inline script, use the nonce provided by the server:

   ```html
   <!-- Server will set res.locals.nonce which can be used in templates -->
   <script nonce="<%= nonce %>">
     // Your inline script here
   </script>
   ```

3. **Avoid Unsafe Dynamic Code Execution**

   Avoid using `eval()`, `new Function()`, or dynamically created script tags, as these are restricted by the CSP:

   ```javascript
   // AVOID these:
   eval('console.log("Hello world")');
   new Function('console.log("Hello world")')();
   
   // USE this instead:
   function safeExecute(code) {
     // Use a safer alternative or implement a secure evaluation method
     // that doesn't rely on dynamic code execution
   }
   ```

4. **Use Safe Data URLs**

   If you need to use data URLs for images, make sure they conform to the CSP:

   ```javascript
   // AVOID potentially unsafe content in data URLs:
   <img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnaGFja2VkJyk8L3NjcmlwdD4=" />
   
   // USE this instead:
   <img src="data:image/png;base64,iVBORw0KGgoAAA..." />
   ```

## Secure Cookie Handling

### Overview

The server sets secure cookies with HttpOnly, Secure, and SameSite attributes. Client-side code should not attempt to modify or access these secure cookies directly.

### Integration Guidelines

1. **Don't Access HttpOnly Cookies**

   HttpOnly cookies cannot be accessed through JavaScript. Don't try to access these cookies:

   ```javascript
   // This won't work for HttpOnly cookies:
   const sessionCookie = document.cookie.match(/session=([^;]*)/);
   ```

2. **Use Server Endpoints for Authentication**

   Instead of trying to access authentication cookies directly, use server endpoints to check authentication status:

   ```javascript
   async function checkAuthentication() {
     const response = await fetch('/api/auth/status');
     const data = await response.json();
     return data.authenticated;
   }
   ```

3. **Handle Session Expiry**

   Handle cases where the session cookie has expired:

   ```javascript
   async function makeAuthenticatedRequest(url, method, body) {
     const response = await fetch(url, {
       method: method,
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(body)
     });
     
     if (response.status === 401) {
       // Unauthorized - redirect to login
       window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
       return null;
     }
     
     return response.json();
   }
   ```

## Input Validation

### Overview

While the server validates all inputs, client-side validation should also be implemented for a better user experience and to reduce unnecessary server requests.

### Integration Guidelines

1. **Implement Client-Side Validation**

   Validate inputs before sending them to the server:

   ```javascript
   function validatePath(path) {
     // Check for directory traversal attempts
     if (path.includes('..')) {
       return { valid: false, message: 'Path contains invalid sequences' };
     }
     
     // Check for valid characters only
     if (!/^[a-zA-Z0-9\/\._-]+$/.test(path)) {
       return { valid: false, message: 'Path contains invalid characters' };
     }
     
     // Check for reasonable path length
     if (path.length > 255) {
       return { valid: false, message: 'Path is too long' };
     }
     
     return { valid: true };
   }
   ```

2. **Show Validation Errors to Users**

   Display validation errors to users before submitting data:

   ```javascript
   function handleSubmit(event) {
     event.preventDefault();
     
     const path = document.getElementById('path').value;
     const validation = validatePath(path);
     
     if (!validation.valid) {
       // Show error to user
       const errorElement = document.getElementById('path-error');
       errorElement.textContent = validation.message;
       errorElement.style.display = 'block';
       return;
     }
     
     // Clear any previous errors
     document.getElementById('path-error').style.display = 'none';
     
     // Submit the form
     submitForm();
   }
   ```

3. **Sanitize User Input for Display**

   When displaying user input, sanitize it to prevent XSS attacks:

   ```javascript
   function sanitizeHTML(text) {
     const element = document.createElement('div');
     element.textContent = text;
     return element.innerHTML;
   }
   
   function displayUserComment(comment) {
     const commentElement = document.getElementById('comment-display');
     commentElement.innerHTML = sanitizeHTML(comment);
   }
   ```

## Error Handling

### Overview

Proper error handling is important for both security and user experience. The server provides detailed error responses that should be handled appropriately on the client side.

### Integration Guidelines

1. **Handle Security Errors**

   Handle security-related errors (authentication, authorization, validation):

   ```javascript
   async function handleRequestWithErrorHandling(url, method, body) {
     try {
       const response = await fetch(url, {
         method: method,
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(body)
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         
         switch (response.status) {
           case 400: // Bad request (validation error)
             displayValidationError(errorData.message);
             break;
           case 401: // Unauthorized
             redirectToLogin();
             break;
           case 403: // Forbidden
             displayPermissionError(errorData.message);
             break;
           case 429: // Too many requests
             displayRateLimitError(errorData.message);
             break;
           default:
             displayGenericError('An error occurred. Please try again later.');
         }
         
         return null;
       }
       
       return response.json();
     } catch (error) {
       displayGenericError('A network error occurred. Please check your connection and try again.');
       console.error('Request failed:', error);
       return null;
     }
   }
   ```

2. **Don't Expose Sensitive Information**

   When handling errors, don't expose sensitive information to users:

   ```javascript
   function logErrorWithoutSensitiveInfo(error) {
     // Don't log sensitive information
     const safeError = {
       message: error.message,
       status: error.status,
       // Don't include auth tokens, cookies, or other sensitive data
     };
     
     console.error('Error:', safeError);
   }
   ```

## Security Best Practices

Here are some general security best practices for client-side code:

1. **Use HTTPS for All Requests**

   Ensure all requests use HTTPS:

   ```javascript
   // Force HTTPS
   if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
     window.location.href = window.location.href.replace('http:', 'https:');
   }
   ```

2. **Implement Proper Authentication Flows**

   Follow proper authentication flows:

   ```javascript
   async function login(username, password) {
     const csrfToken = await getCsrfToken();
     
     const response = await fetch('/api/auth/login', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'CSRF-Token': csrfToken
       },
       body: JSON.stringify({ username, password })
     });
     
     if (response.ok) {
       // Redirect to the dashboard after successful login
       window.location.href = '/dashboard';
     } else {
       // Handle login error
       const errorData = await response.json();
       displayLoginError(errorData.message);
     }
   }
   ```

3. **Implement Secure Logout**

   Implement secure logout functionality:

   ```javascript
   async function logout() {
     const csrfToken = await getCsrfToken();
     
     await fetch('/api/auth/logout', {
       method: 'POST',
       headers: {
         'CSRF-Token': csrfToken
       }
     });
     
     // Redirect to the login page after logout
     window.location.href = '/login';
   }
   ```

4. **Sanitize Data Before Rendering**

   Always sanitize data before rendering it:

   ```javascript
   function renderUserProfile(user) {
     document.getElementById('user-name').textContent = user.name;
     document.getElementById('user-email').textContent = user.email;
     
     // If you're using innerHTML (try to avoid this when possible)
     // make sure to sanitize the content
     if (user.bio) {
       const sanitizedBio = sanitizeHTML(user.bio);
       document.getElementById('user-bio').innerHTML = sanitizedBio;
     }
   }
   ```

5. **Implement Proper Permission Checks**

   Implement proper permission checks in the UI:

   ```javascript
   function updateUIBasedOnPermissions(userRoles) {
     // Show or hide elements based on user roles
     const adminElements = document.querySelectorAll('.admin-only');
     const userElements = document.querySelectorAll('.user-only');
     
     if (userRoles.includes('admin')) {
       adminElements.forEach(el => el.style.display = 'block');
     } else {
       adminElements.forEach(el => el.style.display = 'none');
     }
     
     if (userRoles.includes('user')) {
       userElements.forEach(el => el.style.display = 'block');
     } else {
       userElements.forEach(el => el.style.display = 'none');
     }
   }
   ```

## Conclusion

Following these guidelines will help ensure that client-side code works properly with the server-side security features of the UniRent WebCraft application. Always remember that client-side security is an important part of the overall security architecture, but it's not a replacement for server-side security. Both must work together to provide a secure application.

Regular security reviews and updates should be performed to ensure the client-side security features remain effective and up-to-date with evolving security threats and best practices.