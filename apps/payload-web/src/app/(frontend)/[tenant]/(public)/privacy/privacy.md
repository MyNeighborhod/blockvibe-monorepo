At **BlockVibe**, we respect your privacy and are committed to protecting the personal data we process. This Privacy Policy describes how **TIDIER, LLC** (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, stores, and discloses your information when you access our platform located at [blockvibe.org](https://blockvibe.org) and all associated subdomains, portals, and services.

## 1. Information We Collect

We collect information necessary to operate a secure, multi-tenant community portal and CRM platform. This information falls into three categories:

- **Account Data:** When you register as a user, resident, or business owner, we collect your name, email address, password hash, and optional profile information (bio, links, photo).
- **Tenant Data:** Content created by neighborhood organizers, including pages, updates, fundraising tiers, and poll questionnaires.
- **Contact and Subscription Logs:** For compliance and anti-abuse auditing, we log subscription preferences (e.g., unsubscribed status), email delivery confirmations, bounce events, spam complaints, and unique cryptographic opt-out tokens.

## 2. How We Use Your Information

We use your information solely for the following purposes:

- Providing and maintaining the multi-tenant portals.
- Enabling neighborhood administrators to communicate with their local residents.
- **Anti-Abuse Verification:** Automated processing of email bounces and complaints via Amazon SNS webhooks to immediately suppress delivery to inactive or complaining addresses.
- Injecting platform-wide or local sponsored banners at the footer of free-tier tenant emails.

## 3. Third-Party Email & Delivery Management

To send emails on behalf of neighborhood associations, we utilize third-party Simple Mail Transfer Protocol (SMTP) and API delivery services (such as AWS SES).

- We do not sell, rent, or trade your contact information with advertisers or third parties.
- Any manually entered contact created by an administrator starts in an inactive, invite-only state. No marketing communications or notifications are sent to the address until the recipient actively opts in by accepting the invite.
- All emails carry RFC 8058 compliant headers enabling instant background unsubscribe actions from mail clients.

## 4. Data Sharing and Multitenancy Scoping

Because BlockVibe is a multi-tenant platform, your profile and contact records are logically partitioned:

- Your data is only accessible to the administrators of the specific neighborhood tenant portal you join.
- Opt-out preferences are managed per tenant. Unsubscribing from one neighborhood association does not affect your registrations or subscriptions in other neighborhood portals.

## 5. Security and Cryptography

We employ industry-standard administrative, technical, and physical security measures to protect your information. Cryptographic HMAC signatures, derived from our application key and your email address, are used to validate footer unsubscribe actions securely. This ensures that third parties cannot arbitrarily unsubscribe you from neighborhood lists.

## 6. Contact Information

If you have questions about this Privacy Policy or our privacy practices, please contact us at:

**TIDIER, LLC**
672 40th St
Des Moines, IA 50312
Email: [legal@blockvibe.org](mailto:legal@blockvibe.org)
