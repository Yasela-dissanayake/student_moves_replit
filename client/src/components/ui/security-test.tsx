/**
 * Security Headers Test Component
 * 
 * This component tests whether the security headers and features implemented
 * on the server are working correctly when rendered in the browser.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

export function SecurityTest() {
  const [csrfStatus, setCsrfStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [cspStatus, setCspStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [secureHeadersStatus, setSecureHeadersStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [secureHeadersDetails, setSecureHeadersDetails] = useState<Record<string, string>>({});
  const [cookieStatus, setCookieStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [cookieDetails, setCookieDetails] = useState<Record<string, string>>({});
  const [rateLimitStatus, setRateLimitStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [validationStatus, setValidationStatus] = useState<'success' | 'failed' | 'pending'>('pending');

  // Helper function to render test status icon
  const renderStatusIcon = (status: 'success' | 'failed' | 'pending') => {
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'failed') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  // Test CSRF Protection
  const testCsrf = async () => {
    setCsrfStatus('pending');
    try {
      const request1 = fetch('/api/security-test/csrf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' })
      });
      
      const request2 = fetch('/api/security-test/csrf-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' })
      });

      const [response1, response2] = await Promise.all([request1, request2]);
      
      if (response1.ok && !response2.ok) {
        setCsrfStatus('success');
      } else {
        setCsrfStatus('failed');
      }
    } catch (error) {
      console.error('CSRF test error:', error);
      setCsrfStatus('failed');
    }
  };

  // Test Content Security Policy
  const testCsp = async () => {
    setCspStatus('pending');
    try {
      const response = await fetch('/api/security-test/csp');
      const data = await response.json();
      if (data.success) {
        setCspStatus('success');
      } else {
        setCspStatus('failed');
      }
    } catch (error) {
      console.error('CSP test error:', error);
      setCspStatus('failed');
    }
  };

  // Test Secure Headers
  const testSecureHeaders = async () => {
    setSecureHeadersStatus('pending');
    try {
      const response = await fetch('/api/security-test/secure-headers');
      const data = await response.json();
      if (data.success) {
        setSecureHeadersStatus('success');
        setSecureHeadersDetails(data.headers || {});
      } else {
        setSecureHeadersStatus('failed');
      }
    } catch (error) {
      console.error('Secure headers test error:', error);
      setSecureHeadersStatus('failed');
    }
  };

  // Test Secure Cookies
  const testSecureCookies = async () => {
    setCookieStatus('pending');
    try {
      const response = await fetch('/api/security-test/cookie');
      const data = await response.json();
      if (data.success) {
        setCookieStatus('success');
        setCookieDetails(data.cookies || {});
      } else {
        setCookieStatus('failed');
      }
    } catch (error) {
      console.error('Cookie test error:', error);
      setCookieStatus('failed');
    }
  };

  // Test Rate Limiting
  const testRateLimit = async () => {
    setRateLimitStatus('pending');
    try {
      // Make multiple requests in quick succession to trigger rate limiting
      const requests = Array(6).fill(null).map((_, i) => 
        fetch('/api/security-test/rate-limit')
      );
      
      const responses = await Promise.all(requests);
      
      // If at least one request was rate limited, the test is successful
      if (responses.some(r => r.status === 429)) {
        setRateLimitStatus('success');
        toast({
          title: "Rate limit test successful",
          description: "The rate limiting is working correctly",
          variant: "default",
        });
      } else {
        setRateLimitStatus('failed');
      }
    } catch (error) {
      console.error('Rate limit test error:', error);
      setRateLimitStatus('failed');
    }
  };

  // Test Input Validation
  const testInputValidation = async () => {
    setValidationStatus('pending');
    try {
      // Test with valid input
      const validResponse = await fetch('/api/security-test/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Valid Name', email: 'valid@example.com' })
      });
      
      // Test with invalid input (SQL injection attempt)
      const invalidResponse = await fetch('/api/security-test/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "'; DROP TABLE users; --", email: 'invalid@example.com' })
      });
      
      if (validResponse.ok && !invalidResponse.ok) {
        setValidationStatus('success');
      } else {
        setValidationStatus('failed');
      }
    } catch (error) {
      console.error('Input validation test error:', error);
      setValidationStatus('failed');
    }
  };

  // Run all tests
  const runAllTests = () => {
    testCsrf();
    testCsp();
    testSecureHeaders();
    testSecureCookies();
    testRateLimit();
    testInputValidation();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Security Feature Tests</CardTitle>
          <CardDescription>
            Test the security features implemented in the application to verify they are working as expected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAllTests} className="w-full mb-6">Run All Tests</Button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CSRF Protection */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">CSRF Protection</CardTitle>
                  {renderStatusIcon(csrfStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Tests if Cross-Site Request Forgery protection is working by simulating a legitimate request and an attack.
                </p>
                <Button onClick={testCsrf} variant="outline" size="sm">Test CSRF Protection</Button>
              </CardContent>
            </Card>

            {/* Content Security Policy */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Content Security Policy</CardTitle>
                  {renderStatusIcon(cspStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Verifies if Content Security Policy headers are properly set to prevent XSS attacks.
                </p>
                <Button onClick={testCsp} variant="outline" size="sm">Test CSP Headers</Button>
              </CardContent>
            </Card>

            {/* Secure Headers */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Secure Headers</CardTitle>
                  {renderStatusIcon(secureHeadersStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Checks if all required security headers are properly implemented.
                </p>
                <Button onClick={testSecureHeaders} variant="outline" size="sm">Test Security Headers</Button>
                
                {secureHeadersStatus === 'success' && Object.keys(secureHeadersDetails).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Detected Headers:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Header</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(secureHeadersDetails).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-mono text-xs">{key}</TableCell>
                              <TableCell className="font-mono text-xs truncate max-w-[200px]">{value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Secure Cookies */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Secure Cookies</CardTitle>
                  {renderStatusIcon(cookieStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Verifies if cookies are set with secure attributes (HttpOnly, Secure, SameSite).
                </p>
                <Button onClick={testSecureCookies} variant="outline" size="sm">Test Cookie Security</Button>
                
                {cookieStatus === 'success' && Object.keys(cookieDetails).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Cookie Attributes:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Attribute</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(cookieDetails).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-mono text-xs">{key}</TableCell>
                              <TableCell className="font-mono text-xs">{value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rate Limiting */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Rate Limiting</CardTitle>
                  {renderStatusIcon(rateLimitStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Tests if rate limiting is functioning to prevent brute force and DoS attacks.
                </p>
                <Button onClick={testRateLimit} variant="outline" size="sm">Test Rate Limiting</Button>
              </CardContent>
            </Card>

            {/* Input Validation */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Input Validation</CardTitle>
                  {renderStatusIcon(validationStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Verifies if input validation is correctly implemented to prevent injection attacks.
                </p>
                <Button onClick={testInputValidation} variant="outline" size="sm">Test Input Validation</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter>
          <Alert className={`w-full ${csrfStatus === 'success' && cspStatus === 'success' && secureHeadersStatus === 'success' && cookieStatus === 'success' && rateLimitStatus === 'success' && validationStatus === 'success' ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <AlertTitle>Security Status</AlertTitle>
            <AlertDescription>
              {csrfStatus === 'success' && cspStatus === 'success' && secureHeadersStatus === 'success' && cookieStatus === 'success' && rateLimitStatus === 'success' && validationStatus === 'success' ? (
                'All security features are working correctly!'
              ) : (
                'Some security tests have not been run or have failed. Please run the tests to verify security status.'
              )}
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Implementation Details</CardTitle>
          <CardDescription>
            Technical details about how each security feature is implemented in the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">CSRF Protection</h3>
            <p className="text-gray-600 mb-2">
              Implemented using the csurf middleware which generates unique tokens for each session.
              These tokens are validated for all POST, PUT, DELETE, and PATCH requests.
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              app.use(csrfProtection()); // Middleware that verifies CSRF tokens
            </code>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Content Security Policy</h3>
            <p className="text-gray-600 mb-2">
              Restricts which resources can be loaded and executed, preventing XSS and injection attacks.
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-random-value'; style-src 'self' 'unsafe-inline';
            </code>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Secure Headers</h3>
            <p className="text-gray-600 mb-2">
              Additional security headers to prevent various attacks like clickjacking, MIME-type sniffing, etc.
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              X-Content-Type-Options: nosniff<br />
              X-Frame-Options: DENY<br />
              X-XSS-Protection: 1; mode=block<br />
              Strict-Transport-Security: max-age=31536000; includeSubDomains
            </code>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Secure Cookies</h3>
            <p className="text-gray-600 mb-2">
              Ensures cookies are transmitted securely and not accessible to client-side scripts.
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              Set-Cookie: session=123; HttpOnly; Secure; SameSite=Strict
            </code>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Rate Limiting</h3>
            <p className="text-gray-600 mb-2">
              Prevents abuse by limiting the number of requests from a single IP in a given time period.
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              const limiter = rateLimit(&#123;<br />
              &nbsp;&nbsp;windowMs: 15 * 60 * 1000, // 15 minutes<br />
              &nbsp;&nbsp;max: 100, // limit each IP to 100 requests per windowMs<br />
              &nbsp;&nbsp;standardHeaders: true,<br />
              &nbsp;&nbsp;legacyHeaders: false,<br />
              &#125;);
            </code>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Input Validation</h3>
            <p className="text-gray-600 mb-2">
              Validates all user inputs using Zod schemas to prevent injection attacks.
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              const schema = z.object(&#123;<br />
              &nbsp;&nbsp;name: z.string().min(1).max(100),<br />
              &nbsp;&nbsp;email: z.string().email(),<br />
              &#125;);<br /><br />
              
              // Validate input before processing<br />
              const result = schema.safeParse(req.body);<br />
              if (!result.success) &#123;<br />
              &nbsp;&nbsp;return res.status(400).json(&#123; error: 'Invalid input' &#125;);<br />
              &#125;
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}