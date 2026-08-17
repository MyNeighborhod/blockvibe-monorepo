# BlockVibe

BlockVibe is a multi-tenant community platform designed to empower organizations with site building, membership management, fundraising, voting, and CRM capabilities.

## Repository Structure

This repository is organized as a Turborepo monorepo:

- **`apps/payload-web`**: The core multi-tenant web application and administration portal powered by Payload CMS.
- **`services/`**: Decoupled backend microservices, such as `chat-service` and `email-service`.
- **`packages/`**: Shared configurations, TypeScript typings, and contract definitions.

## Project Milestones

This project is built in iterations. Each milestone can have a basic implementation of the feature, then the next milestone can further improve it. 

Legend: 
- 📌 To do
- 🛠️ In progress
- 🥂 Done
- 🔮 Just vibes (for now)

### Infra Deploy Pipeline

| Description | Status |
| :--- | :--- |
| v1 Baseline | 🥂 Done |
| Safety | 🛠️ In progress |
| Recoverability | 📌 To do |
| Hardening | 📌 To do |
| Automation | 📌 To do |

### Milestone M1: Community Platform

| Description | Status |
| :--- | :--- |
| Basic but intuitive site builder | 🛠️ In Progress |
| Form submission handler to stored data and optional emailing, captcha | 📌 To do |
| Members profiles and management | 📌 To do |
| Members Email Notifications (transactional emails via SES) | 📌 To do |
| Admin Emailing Members via GMail Integration | 📌 To do |
| Admin: connect your Mailchimp, Sendgrid, Resend, Nodemailer, Brevo | 📌 To do |
| Members skill sharing and meet-ups | 📌 To do |
| Members tool sharing library | 📌 To do |
| Presentation Demo (Product demo script & default tenant) | 🔮 Just vibes (for now) |

