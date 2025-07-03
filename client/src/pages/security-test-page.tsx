/**
 * Security Test Page
 * 
 * Provides a UI for verifying the security features in the application.
 */
import { SecurityTest } from "@/components/ui/security-test";

export function SecurityTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Security Features Test</h1>
      <p className="mb-6 text-gray-600">
        This page allows you to test various security features implemented in the UniRent WebCraft platform.
        Each section below tests a specific security feature and displays the results.
      </p>

      <SecurityTest />
      
      <div className="mt-12 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Security Features Summary</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Content Security Policy (CSP) protection against XSS and injection attacks</li>
          <li>CSRF Protection to prevent cross-site request forgery</li>
          <li>Secure Cookies with HttpOnly, Secure, and SameSite flags</li>
          <li>Comprehensive Security Headers (X-Content-Type-Options, X-Frame-Options, etc.)</li>
          <li>Input Validation and Sanitization</li>
          <li>Rate Limiting for sensitive operations</li>
          <li>Detailed Security Logging and Monitoring</li>
        </ul>
      </div>
    </div>
  );
}