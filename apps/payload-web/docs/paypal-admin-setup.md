# PayPal Admin Setup Guide (Payload CMS Admin UI)

This document provides step-by-step instructions for platform administrators to configure, manage, and test PayPal integration directly from the **Payload CMS Admin Panel** without editing environment files or redeploying code.

---

## 1. Overview

The Payment Service in Payload CMS uses dynamic configuration stored in the **`Payment Settings`** global document. Administrators can:
* Input PayPal API keys (**Client ID** and **Client Secret**).
* Switch between **Sandbox (Testing)** and **Live (Production)** environments on the fly.
* Adjust annual dues rates (e.g., $10 Individual / $20 Household for North of Grand).
* Toggle payment methods (**PayPal / Credit Card** vs **Offline Check / Cash**).

---

## 2. Step-by-Step Configuration Guide

### Step 1: Obtain Credentials from PayPal Developer Dashboard
1. Log in to the [PayPal Developer Portal](https://developer.paypal.com).
2. Navigate to **Apps & Credentials** in the top navigation or sidebar.
3. Choose the environment tab you want to configure:
   * **Sandbox**: For local testing and staging (no real money charged).
   * **Live**: For production (real money charged).
4. Click **Create App** (or select an existing App).
5. Copy your generated:
   * **Client ID** (e.g., `AZ...`)
   * **Secret** (e.g., `EL...`)

---

### Step 2: Open Payload CMS Admin Panel
1. Access the Admin Panel URL (e.g. `http://localhost:3000/admin` locally or `https://www.northofgranddsm.org/admin` in production).
2. Log in with an **Admin** or **Superadmin** account.

---

### Step 3: Enter Credentials in Payment Settings
1. In the left navigation menu, scroll down to the **Globals** section.
2. Click on **Payment Settings**.
3. Fill out the configuration fields:

| Field Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| **PayPal Client ID** | Client ID copied from PayPal Developer Dashboard | `AZ...` |
| **PayPal Client Secret** | Client Secret copied from PayPal Developer Dashboard | `EL...` |
| **PayPal Environment** | Select `Sandbox (Testing)` or `Live (Production)` | `Sandbox` (for dev/test) |
| **Individual Annual Dues ($)** | Base annual membership rate for individual residents | `10` |
| **Household Annual Dues ($)** | Base annual membership rate for households | `20` |
| **Enable PayPal Payments** | Checkbox to enable/disable online PayPal checkout | Checked |
| **Enable Check Payments** | Checkbox to enable/disable offline paper check & cash registration | Checked |

4. Click the **Save** button in the upper right corner.

> [!NOTE]
> Changes saved in **Payment Settings** take effect immediately for all new membership signups, renewals, and donations. No server restart is required.

---

## 3. Testing & Verification

### Testing Sandbox Payments Locally
1. Ensure **PayPal Environment** is set to `Sandbox (Testing)` in Payment Settings.
2. In the PayPal Developer Portal, go to **Testing Tools $\rightarrow$ Sandbox Accounts** to view your pre-generated sandbox buyer email (e.g., `sb-xxxx@personal.example.com`).
3. Visit the public membership signup page at `/membership/signup`.
4. Fill out the form, choose **Credit / Debit Card or PayPal**, and proceed.
5. In the PayPal checkout popup, log in with the sandbox buyer credentials to complete the test payment.

### Testing Offline / Paper Check Registrations
1. On the public signup page `/membership/signup`, select **"I will pay cash / check / other ways later"**.
2. Submit the form. A new user account, membership profile, and **`accountId` ULID** will be created immediately with status *Registered - Pending Offline Payment*.
3. When the paper check or cash is received, an admin can record the payment via the admin API (`/api/membership/record-manual-payment`), which automatically activates the user's annual paying status!

---

## 4. Going Live (Production Deployment)

When you are ready to process real transactions:
1. In PayPal Developer Portal, toggle to **Live** and copy your **Live Client ID** and **Live Secret**.
2. Log into the Production Admin Panel (`/admin`).
3. Open **Globals $\rightarrow$ Payment Settings**.
4. Update the **PayPal Client ID** and **PayPal Client Secret** with your Live keys.
5. Set **PayPal Environment** to `Live (Production)`.
6. Click **Save**.
